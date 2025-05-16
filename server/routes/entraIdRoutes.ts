import { Router, Request, Response, NextFunction } from 'express';
import { env, isEntraIdConfigured } from '../config/env';
import { 
  initializeEntraId, 
  createAuthorizationUrl, 
  handleCallback, 
  getUserInfo, 
  findOrCreateUser 
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
let entraIdInitialized = false;

async function initializeEntraIdClient() {
  if (entraIdInitialized) return;
  
  try {
    if (isEntraIdConfigured()) {
      logger.info('Initializing Microsoft Entra ID client with configuration', {
        clientId: env.ENTRA_ID_CLIENT_ID ? 'provided' : 'missing',
        clientSecret: env.ENTRA_ID_CLIENT_SECRET ? 'provided' : 'missing',
        tenantId: env.ENTRA_ID_TENANT_ID ? 'provided' : 'missing',
        redirectUri: env.ENTRA_ID_REDIRECT_URI,
        scopes: env.ENTRA_ID_SCOPES
      });
      
      await initializeEntraId({
        clientId: env.ENTRA_ID_CLIENT_ID!,
        clientSecret: env.ENTRA_ID_CLIENT_SECRET!,
        tenantId: env.ENTRA_ID_TENANT_ID!,
        redirectUri: env.ENTRA_ID_REDIRECT_URI!,
        scopes: env.ENTRA_ID_SCOPES.split(' ')
      });
      
      entraIdInitialized = true;
      logger.info('Microsoft Entra ID client initialized successfully');
    } else {
      logger.warn('Microsoft Entra ID SSO is not configured or disabled');
    }
  } catch (error) {
    logger.error('Failed to initialize Microsoft Entra ID client', { error });
  }
}

// Initialize on module load
initializeEntraIdClient();

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
    
    // Make sure Entra ID client is initialized
    await initializeEntraIdClient();
    
    if (!hasInitializedEntraIdClient()) {
      logger.error('Microsoft Entra ID client failed to initialize');
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize Microsoft Entra ID client'
      });
    }
    
    // Create authorization URL with PKCE
    const { url, state } = createAuthorizationUrl({
      clientId: env.ENTRA_ID_CLIENT_ID,
      clientSecret: env.ENTRA_ID_CLIENT_SECRET,
      tenantId: env.ENTRA_ID_TENANT_ID,
      redirectUri: env.ENTRA_ID_REDIRECT_URI!,
      scopes: env.ENTRA_ID_SCOPES.split(' ')
    });
    
    // Store state in session for validation
    if (req.session) {
      req.session.entraIdState = state;
    }
    
    logger.info('Redirecting to Microsoft Entra ID for authentication', { redirectUrl: url });
    res.redirect(url);
  } catch (error) {
    // Log detailed error information
    if (error instanceof Error) {
      logger.error('Failed to create Microsoft Entra ID authorization URL', { 
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack 
      });
    } else {
      logger.error('Failed to create Microsoft Entra ID authorization URL with unknown error');
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
  res.json({
    enabled: isEnabled,
    message: isEnabled 
      ? 'Microsoft Entra ID authentication is configured and ready to use' 
      : 'Microsoft Entra ID authentication is not configured'
  });
});

export default router;