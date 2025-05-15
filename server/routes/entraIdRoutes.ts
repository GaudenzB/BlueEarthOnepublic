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

const router = Router();

// Initialize Microsoft Entra ID client when the routes are loaded
(async () => {
  try {
    if (isEntraIdConfigured()) {
      await initializeEntraId({
        clientId: env.ENTRA_ID_CLIENT_ID!,
        clientSecret: env.ENTRA_ID_CLIENT_SECRET!,
        tenantId: env.ENTRA_ID_TENANT_ID!,
        redirectUri: env.ENTRA_ID_REDIRECT_URI!,
        scopes: env.ENTRA_ID_SCOPES.split(' ')
      });
      logger.info('Microsoft Entra ID client initialized successfully');
    } else {
      logger.warn('Microsoft Entra ID SSO is not configured or disabled');
    }
  } catch (error) {
    logger.error('Failed to initialize Microsoft Entra ID client', { error });
  }
})();

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
router.get('/login', requireEntraIdEnabled, (req: Request, res: Response) => {
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
    }
    
    logger.info('Redirecting to Microsoft Entra ID for authentication', { redirectUrl: url });
    res.redirect(url);
  } catch (error) {
    logger.error('Failed to create Microsoft Entra ID authorization URL', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Microsoft Entra ID login'
    });
  }
});

// Callback route for Microsoft Entra ID
router.get('/callback', requireEntraIdEnabled, async (req: Request, res: Response) => {
  try {
    // Verify state parameter to prevent CSRF
    const { state } = req.query as { state: string };
    const storedState = req.session?.entraIdState;
    
    if (!state || !storedState || state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    
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
    
    // Set JWT in cookie or send back to client
    // For SPA applications, return the token in the response
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
    
    // Redirect with token as URL fragment
    // This is a common pattern for SPA authentication flows
    // The client-side app will read the token from the URL fragment
    const frontendUrl = new URL(env.API_URL || 'http://localhost:3000');
    frontendUrl.pathname = '/auth/entra/complete';
    frontendUrl.hash = `token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    
    res.redirect(frontendUrl.toString());
  } catch (error) {
    logger.error('Microsoft Entra ID authentication callback error', { error });
    
    // Redirect to error page
    const frontendUrl = new URL(env.API_URL || 'http://localhost:3000');
    frontendUrl.pathname = '/auth/entra/error';
    res.redirect(frontendUrl.toString());
  }
});

// Route to check if Microsoft Entra ID is enabled and configured
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    enabled: isEntraIdConfigured()
  });
});

export default router;