import { Router, Request, Response, NextFunction } from 'express';
import { env, isEntraIdConfigured } from '../config/env';
import { 
  initializeEntraId, 
  createAuthorizationUrl, 
  handleCallback, 
  getUserInfo, 
  findOrCreateUser,
  hasInitializedEntraIdClient
} from '../services/entraIdService';
import { logger } from '../utils/logger';
import { generateUserToken } from '../auth';
import { setAuthCookies } from '../utils/cookieManager';
import { wrapHandler } from '../utils/errorHandling';
import { Session } from 'express-session';

// Extend the express-session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    entraIdState?: string;
  }
}

const router = Router();

// Initialize Microsoft Entra ID client when the routes are loaded
async function initializeEntraIdClient(): Promise<boolean> {
  // If client is already initialized, return success
  if (hasInitializedEntraIdClient()) {
    logger.info('Microsoft Entra ID client already initialized, reusing existing client');
    return true;
  }
  
  try {
    if (!isEntraIdConfigured()) {
      logger.warn('Microsoft Entra ID SSO is not properly configured or is disabled');
      return false;
    }
    
    logger.info('Initializing Microsoft Entra ID client with configuration', {
      clientId: env.ENTRA_ID_CLIENT_ID ? 'provided' : 'missing',
      clientSecret: env.ENTRA_ID_CLIENT_SECRET ? 'provided' : 'missing',
      tenantId: env.ENTRA_ID_TENANT_ID ? 'provided' : 'missing',
      redirectUri: env.ENTRA_ID_REDIRECT_URI,
      scopes: env.ENTRA_ID_SCOPES
    });
    
    // Initialize with all required parameters
    const client = await initializeEntraId({
      clientId: env.ENTRA_ID_CLIENT_ID!,
      clientSecret: env.ENTRA_ID_CLIENT_SECRET!,
      tenantId: env.ENTRA_ID_TENANT_ID!,
      redirectUri: env.ENTRA_ID_REDIRECT_URI!,
      scopes: env.ENTRA_ID_SCOPES.split(' ')
    });
    
    if (!client) {
      logger.error('Microsoft Entra ID client initialization returned null/undefined');
      return false;
    }
    
    logger.info('Microsoft Entra ID client initialized successfully');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to initialize Microsoft Entra ID client', { 
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack 
      });
    } else {
      logger.error('Failed to initialize Microsoft Entra ID client with unknown error', { error });
    }
    return false;
  }
}

// Initialize on module load (but don't await the result, just fire it off)
initializeEntraIdClient().then(success => {
  if (success) {
    logger.info('Microsoft Entra ID client initialized at module load time');
  } else {
    logger.warn('Microsoft Entra ID client failed to initialize at module load time, will retry on demand');
  }
}).catch(error => {
  logger.error('Unexpected error during initial Microsoft Entra ID client initialization', { error });
});

// Middleware to check if Microsoft Entra ID is enabled
const requireEntraIdEnabled = (req: Request, res: Response, next: NextFunction) => {
  if (!isEntraIdConfigured()) {
    return res.status(404).json({
      success: false,
      message: 'Microsoft Entra ID authentication is not configured or disabled'
    });
  }
  next();
};

// Route to initiate login with Microsoft Entra ID
router.get('/login', requireEntraIdEnabled, async (req: Request, res: Response) => {
  try {
    // Check if all required Microsoft Entra ID environment variables are set
    if (!env.ENTRA_ID_CLIENT_ID || !env.ENTRA_ID_CLIENT_SECRET || !env.ENTRA_ID_TENANT_ID) {
      logger.error('Microsoft Entra ID credentials missing', {
        hasClientId: !!env.ENTRA_ID_CLIENT_ID,
        hasClientSecret: !!env.ENTRA_ID_CLIENT_SECRET,
        hasTenantId: !!env.ENTRA_ID_TENANT_ID
      });
      
      return res.status(500).json({
        success: false,
        message: 'Microsoft Entra ID is not properly configured'
      });
    }
    
    // Attempt to initialize the client if it's not already initialized
    logger.info('Microsoft login initiated, ensuring client is initialized');
    const initSuccess = await initializeEntraIdClient();
    
    if (!initSuccess || !hasInitializedEntraIdClient()) {
      logger.error('Microsoft Entra ID client failed to initialize (fatal error)');
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize Microsoft Entra ID client'
      });
    }
    
    logger.info('Creating Microsoft Entra ID authorization URL');
    
    try {
      // Create authorization URL with PKCE
      const { url, state } = createAuthorizationUrl({
        clientId: env.ENTRA_ID_CLIENT_ID!,
        clientSecret: env.ENTRA_ID_CLIENT_SECRET!,
        tenantId: env.ENTRA_ID_TENANT_ID!,
        redirectUri: env.ENTRA_ID_REDIRECT_URI!,
        scopes: env.ENTRA_ID_SCOPES.split(' ')
      });
      
      // Store state in session for validation
      if (req.session) {
        req.session.entraIdState = state;
        logger.info('Stored Microsoft Entra ID state in session', { stateLength: state.length });
      } else {
        logger.warn('Session object not available, cannot store state');
      }

      logger.info('Redirecting to Microsoft Entra ID for authentication', { 
        urlLength: url.length,
        urlPrefix: url.substring(0, 30) + '...' 
      });
      
      // Redirect to Microsoft Entra ID login page
      res.redirect(url);
    } catch (urlError) {
      logger.error('Failed to create Microsoft Entra ID authorization URL', { 
        error: urlError instanceof Error ? urlError.message : 'Unknown error'
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create Microsoft Entra ID login URL'
      });
    }
  } catch (error) {
    // Log detailed error information
    if (error instanceof Error) {
      logger.error('Failed to initiate Microsoft Entra ID login flow', { 
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack 
      });
    } else {
      logger.error('Failed to initiate Microsoft Entra ID login flow with unknown error');
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Microsoft Entra ID login'
    });
  }
});

// Callback route for Microsoft Entra ID
router.get('/callback', requireEntraIdEnabled, wrapHandler(async (req: Request, res: Response) => {
  // Make sure Entra ID client is initialized
  await initializeEntraIdClient();
  
  // Verify state parameter to prevent CSRF
  const { state } = req.query as { state: string };
  const storedState = req.session?.entraIdState;
  
  if (!state || !storedState || state !== storedState) {
    logger.warn('Invalid state parameter in Entra ID callback', {
      receivedState: state,
      hasStoredState: !!storedState,
      match: state === storedState
    });
    throw new Error('Invalid state parameter');
  }
  
  logger.info('Microsoft Entra ID callback received with valid state', {
    hasStoredState: !!storedState
  });
  
  // Clear session state
  if (req.session) {
    delete req.session.entraIdState;
  }
  
  // Get authorization code and exchange for tokens
  const tokenSet = await handleCallback(req, {
    clientId: env.ENTRA_ID_CLIENT_ID!,
    clientSecret: env.ENTRA_ID_CLIENT_SECRET!,
    tenantId: env.ENTRA_ID_TENANT_ID!,
    redirectUri: env.ENTRA_ID_REDIRECT_URI!,
    scopes: env.ENTRA_ID_SCOPES.split(' ')
  });
  
  // Get user info from tokens
  const entraIdUser = await getUserInfo(tokenSet);
  
  // Find or create user in our database
  const user = await findOrCreateUser(entraIdUser);
  
  // Generate JWT tokens for our application
  const tokens = generateUserToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
  
  // Set authentication cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  
  if (user.isNewUser) {
    logger.info('New user created from Microsoft Entra ID login', { 
      userId: user.id, 
      email: user.email 
    });
  } else {
    logger.info('Existing user logged in with Microsoft Entra ID', { 
      userId: user.id, 
      email: user.email 
    });
  }
  
  // Redirect to success page - cookies are already set
  const frontendUrl = new URL(env.API_URL || 'http://localhost:3000');
  frontendUrl.pathname = '/auth/entra/complete';
  
  res.redirect(frontendUrl.toString());
}));

// Token exchange route for client-side handling
// This is needed for compatibility with our previous token approach
router.post('/exchange', requireEntraIdEnabled, wrapHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body;
  
  if (!accessToken || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Both access token and refresh token are required'
    });
  }
  
  try {
    // Set the tokens as secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);
    
    // Return success message
    return res.status(200).json({
      success: true,
      message: 'Authentication tokens exchanged successfully',
    });
  } catch (error) {
    logger.error('Failed to exchange Entra ID tokens', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to exchange tokens'
    });
  }
}));

// Route to check if Microsoft Entra ID is enabled and configured
router.get('/status', (req: Request, res: Response) => {
  const isEnabled = isEntraIdConfigured();
  
  // Provide detailed configuration status for debugging
  const configStatus = {
    enabled: isEnabled,
    clientIdConfigured: !!env.ENTRA_ID_CLIENT_ID,
    tenantIdConfigured: !!env.ENTRA_ID_TENANT_ID,
    clientSecretConfigured: !!env.ENTRA_ID_CLIENT_SECRET,
    redirectUriConfigured: !!env.ENTRA_ID_REDIRECT_URI,
    redirectUri: env.ENTRA_ID_REDIRECT_URI,
    scopes: env.ENTRA_ID_SCOPES
  };
  
  logger.info('Microsoft Entra ID status requested', { configStatus });
  
  res.json({
    enabled: isEnabled,
    message: isEnabled 
      ? 'Microsoft Entra ID authentication is configured and ready to use' 
      : 'Microsoft Entra ID authentication is not configured',
    config: configStatus
  });
});

export default router;