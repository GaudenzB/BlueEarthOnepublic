import { Issuer, Client, TokenSet, generators } from 'openid-client';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { db } from '../database';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth';
import crypto from 'crypto';

// Configuration for Microsoft Azure AD
export interface AzureAdConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

export interface AzureAdUser {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  email: string;
  userPrincipalName: string;
}

// Store PKCE code verifiers in memory (for production, consider a session store like Redis)
const codeVerifiers = new Map<string, string>();

let azureAdClient: Client | null = null;

/**
 * Initialize the Azure AD OpenID Connect client
 */
export async function initializeAzureAd(config: AzureAdConfig): Promise<Client> {
  try {
    // Create the Azure AD issuer
    const issuer = await Issuer.discover(
      `https://login.microsoftonline.com/${config.tenantId}/v2.0/.well-known/openid-configuration`
    );
    
    logger.info('Azure AD OIDC issuer discovered successfully', { 
      issuer: issuer.metadata.issuer,
      azureAdTenant: config.tenantId 
    });

    // Create the client
    azureAdClient = new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [config.redirectUri],
      response_types: ['code'],
    });

    return azureAdClient;
  } catch (error) {
    logger.error('Failed to initialize Azure AD client', { error });
    throw error;
  }
}

/**
 * Get the Azure AD client
 */
export function getAzureAdClient(): Client {
  if (!azureAdClient) {
    throw new Error('Azure AD client has not been initialized');
  }
  return azureAdClient;
}

/**
 * Create authorization URL to redirect the user to Azure AD login page
 */
export function createAuthorizationUrl(config: AzureAdConfig): { url: string, state: string } {
  const client = getAzureAdClient();
  
  // Generate PKCE code challenge
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  
  // Generate state for CSRF protection
  const state = generators.state();
  
  // Store the code verifier keyed by state
  codeVerifiers.set(state, codeVerifier);
  
  // Clean up old verifiers to prevent memory leaks
  setTimeout(() => {
    codeVerifiers.delete(state);
  }, 1000 * 60 * 10); // 10 minutes expiry
  
  const url = client.authorizationUrl({
    scope: config.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
  
  return { url, state };
}

/**
 * Handle the callback from Azure AD and get tokens
 */
export async function handleCallback(req: Request, config: AzureAdConfig): Promise<TokenSet> {
  const client = getAzureAdClient();
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
export async function getUserInfo(tokenSet: TokenSet): Promise<AzureAdUser> {
  const client = getAzureAdClient();
  
  // Verify the ID token
  const claims = tokenSet.claims();
  
  // Alternatively, use the userinfo endpoint
  // const userinfo = await client.userinfo(tokenSet);
  
  // Map claims to user object
  const user: AzureAdUser = {
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
 * Find or create a user based on Azure AD information
 */
export async function findOrCreateUser(azureAdUser: AzureAdUser): Promise<{
  id: number;
  username: string;
  email: string;
  role: string;
  isNewUser: boolean;
}> {
  try {
    // Try to find user by email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, azureAdUser.email)
    });
    
    if (existingUser) {
      // Update Azure ID if not already set
      if (!existingUser.azureAdId) {
        await db.update(users)
          .set({ azureAdId: azureAdUser.id })
          .where(eq(users.id, existingUser.id));
        
        logger.info('Updated existing user with Azure AD ID', { 
          userId: existingUser.id, 
          azureAdId: azureAdUser.id 
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
    const username = azureAdUser.email.split('@')[0];
    
    // Default role
    const defaultRole = 'user';
    
    // Insert new user
    const [newUser] = await db.insert(users)
      .values({
        username,
        email: azureAdUser.email,
        password: hashedPassword,
        role: defaultRole,
        azureAdId: azureAdUser.id,
        firstName: azureAdUser.givenName,
        lastName: azureAdUser.surname
      })
      .returning();
    
    logger.info('Created new user from Azure AD login', { 
      userId: newUser.id, 
      email: azureAdUser.email,
      azureAdId: azureAdUser.id
    });
    
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isNewUser: true
    };
  } catch (error) {
    logger.error('Error finding or creating user from Azure AD', { 
      error, 
      azureAdUserId: azureAdUser.id,
      azureAdEmail: azureAdUser.email 
    });
    throw error;
  }
}