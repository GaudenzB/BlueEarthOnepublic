import * as openidClient from 'openid-client';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth';
import crypto from 'crypto';

// Configuration for Microsoft Entra ID
export interface EntraIdConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

export interface EntraIdUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  email: string;
  userPrincipalName: string;
}

// Store PKCE code verifiers in memory (for production, consider a session store like Redis)
const codeVerifiers = new Map<string, string>();

let entraIdClient: openidClient.Client | null = null;

/**
 * Initialize the Microsoft Entra ID OpenID Connect client
 */
export async function initializeEntraId(config: EntraIdConfig): Promise<openidClient.Client> {
  try {
    // Validate the configuration
    if (!config.clientId || !config.clientSecret || !config.tenantId) {
      const missing = [];
      if (!config.clientId) missing.push('clientId');
      if (!config.clientSecret) missing.push('clientSecret');
      if (!config.tenantId) missing.push('tenantId');
      
      const missingMsg = `Missing required Microsoft Entra ID configuration: ${missing.join(', ')}`;
      logger.error(missingMsg);
      throw new Error(missingMsg);
    }
    
    // Log the configuration being used (redacting secrets)
    logger.info('Initializing Microsoft Entra ID client with configuration details', { 
      tenantId: config.tenantId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      hasClientId: !!config.clientId,
      hasClientSecret: !!config.clientSecret
    });
    
    // Create the Microsoft Entra ID issuer with explicit timeout and retry
    const issuerUrl = `https://login.microsoftonline.com/${config.tenantId}/v2.0/.well-known/openid-configuration`;
    logger.info('Discovering Microsoft Entra ID issuer', { issuerUrl });
    
    let issuer;
    try {
      issuer = await openidClient.Issuer.discover(issuerUrl);
    } catch (discoverError) {
      logger.error('Failed to discover Microsoft Entra ID issuer', { 
        error: discoverError instanceof Error ? discoverError.message : 'Unknown error' 
      });
      throw new Error(`Failed to discover Microsoft Entra ID issuer: ${discoverError instanceof Error ? discoverError.message : 'Unknown error'}`);
    }
    
    if (!issuer) {
      logger.error('Microsoft Entra ID issuer discovery returned null/undefined');
      throw new Error('Microsoft Entra ID issuer discovery returned null/undefined');
    }
    
    logger.info('Microsoft Entra ID OIDC issuer discovered successfully', { 
      issuer: issuer.metadata.issuer,
      entraIdTenant: config.tenantId,
      authorizationEndpoint: issuer.metadata.authorization_endpoint,
      tokenEndpoint: issuer.metadata.token_endpoint
    });

    // Create the client with explicit configuration
    try {
      entraIdClient = new issuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
      });
    } catch (clientError) {
      logger.error('Failed to create Microsoft Entra ID client', { 
        error: clientError instanceof Error ? clientError.message : 'Unknown error'
      });
      throw new Error(`Failed to create Microsoft Entra ID client: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`);
    }
    
    if (!entraIdClient) {
      logger.error('Microsoft Entra ID client creation returned null/undefined');
      throw new Error('Microsoft Entra ID client creation returned null/undefined');
    }

    logger.info('Microsoft Entra ID client created successfully', {
      clientId: config.clientId.substring(0, 5) + '...',
      redirectUri: config.redirectUri
    });
    
    return entraIdClient;
  } catch (error) {
    // Clear the client if initialization failed
    entraIdClient = null;
    
    // Provide more detailed error logging
    if (error instanceof Error) {
      logger.error('Failed to initialize Microsoft Entra ID client', { 
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack 
      });
    } else {
      logger.error('Failed to initialize Microsoft Entra ID client with unknown error type', { error });
    }
    throw error;
  }
}

/**
 * Get the Microsoft Entra ID client
 */
export function getEntraIdClient(): openidClient.Client {
  if (!entraIdClient) {
    logger.error('Microsoft Entra ID client requested but not initialized');
    throw new Error('Microsoft Entra ID client has not been initialized');
  }
  return entraIdClient;
}

/**
 * Safe wrapper to get Entra ID client that doesn't throw
 */
export function hasInitializedEntraIdClient(): boolean {
  return !!entraIdClient;
}

/**
 * Create authorization URL to redirect the user to Microsoft Entra ID login page
 */
export function createAuthorizationUrl(config: EntraIdConfig): { url: string, state: string } {
  try {
    // Check if client is initialized
    if (!hasInitializedEntraIdClient()) {
      logger.error('Cannot create authorization URL: Microsoft Entra ID client not initialized');
      throw new Error('Microsoft Entra ID client not initialized');
    }
    
    const client = getEntraIdClient();
    
    // Generate PKCE code challenge
    const codeVerifier = openidClient.generators.codeVerifier();
    const codeChallenge = openidClient.generators.codeChallenge(codeVerifier);
    
    // Generate state for CSRF protection
    const state = openidClient.generators.state();
    
    // Store the code verifier keyed by state
    codeVerifiers.set(state, codeVerifier);
    
    // Clean up old verifiers to prevent memory leaks
    setTimeout(() => {
      codeVerifiers.delete(state);
    }, 1000 * 60 * 10); // 10 minutes expiry
    
    // Log the scopes and state for debugging
    logger.info('Creating Microsoft Entra ID authorization URL', {
      scopes: config.scopes,
      state: state.substring(0, 8) + '...',
      verifierLength: codeVerifier.length,
      challengeLength: codeChallenge.length
    });
    
    const url = client.authorizationUrl({
      scope: config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });
    
    logger.info('Microsoft Entra ID authorization URL created successfully', {
      urlLength: url.length,
      urlPrefix: url.substring(0, 50) + '...',
      state: state.substring(0, 8) + '...'
    });
    
    return { url, state };
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to create Microsoft Entra ID authorization URL', { 
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack 
      });
    } else {
      logger.error('Failed to create Microsoft Entra ID authorization URL with unknown error type');
    }
    throw error;
  }
}

/**
 * Handle the callback from Microsoft Entra ID and get tokens
 */
export async function handleCallback(req: Request, config: EntraIdConfig): Promise<openidClient.TokenSet> {
  const client = getEntraIdClient();
  const { code, state } = req.query as { code: string, state: string };
  
  // Verify state to prevent CSRF
  if (!state || !codeVerifiers.has(state)) {
    throw new Error('Invalid state parameter');
  }
  
  // Get code verifier and cleanup
  const codeVerifier = codeVerifiers.get(state)!;
  codeVerifiers.delete(state);
  
  // Get tokens using the authorization code
  const tokenSet = await client.callback(
    config.redirectUri,
    { code, state },
    { code_verifier: codeVerifier }
  );
  
  return tokenSet;
}

/**
 * Verify and decode ID token to get user info
 */
export async function getUserInfo(tokenSet: openidClient.TokenSet): Promise<EntraIdUser> {
  const client = getEntraIdClient();
  
  // Verify the ID token
  const claims = tokenSet.claims();
  
  // Alternatively, use the userinfo endpoint
  // const userinfo = await client.userinfo(tokenSet);
  
  // Map claims to user object
  const user: EntraIdUser = {
    id: claims.oid || claims.sub,
    displayName: claims.name || '',
    givenName: claims.given_name || '',
    surname: claims.family_name || '',
    email: claims.email || claims.preferred_username || '',
    userPrincipalName: claims.preferred_username || claims.email || '',
  };
  
  return user;
}

/**
 * Find or create a user based on Microsoft Entra ID information
 */
export async function findOrCreateUser(entraIdUser: EntraIdUser): Promise<{
  id: number;
  username: string;
  email: string;
  role: string;
  isNewUser: boolean;
}> {
  try {
    // Try to find user by email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, entraIdUser.email)
    });
    
    if (existingUser) {
      // Update Entra ID if not already set
      if (!existingUser.entraSsoId) {
        await db.update(users)
          .set({ entraSsoId: entraIdUser.id })
          .where(eq(users.id, existingUser.id));
        
        logger.info('Updated existing user with Microsoft Entra ID', { 
          userId: existingUser.id, 
          entraId: entraIdUser.id 
        });
      }
      
      return {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
        isNewUser: false
      };
    }
    
    // Create new user if not found
    // Generate a random password since login will be via SSO
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    
    // Create simple username from email
    const username = entraIdUser.email.split('@')[0];
    
    // Default role
    const defaultRole = 'user';
    
    // Insert new user
    const [newUser] = await db.insert(users)
      .values({
        username,
        email: entraIdUser.email,
        password: hashedPassword,
        role: defaultRole,
        entraSsoId: entraIdUser.id,
        firstName: entraIdUser.givenName,
        lastName: entraIdUser.surname
      })
      .returning();
    
    logger.info('Created new user from Microsoft Entra ID login', { 
      userId: newUser.id, 
      email: entraIdUser.email,
      entraId: entraIdUser.id
    });
    
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isNewUser: true
    };
  } catch (error) {
    logger.error('Error finding or creating user from Microsoft Entra ID', { 
      error, 
      entraIdUserId: entraIdUser.id,
      entraIdEmail: entraIdUser.email 
    });
    throw error;
  }
}