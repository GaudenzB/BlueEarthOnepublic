import { Router, Request, Response, NextFunction } from 'express';
import { env, isAzureAdConfigured } from '../config/env';
import { 
  initializeAzureAd, 
  createAuthorizationUrl, 
  handleCallback, 
  getUserInfo, 
  findOrCreateUser 
} from '../services/azureAdService';
import { logger } from '../utils/logger';
import { generateUserToken } from '../auth';

const router = Router();

// Initialize Azure AD client when the routes are loaded
(async () => {
  try {
    if (isAzureAdConfigured()) {
      await initializeAzureAd({
        clientId: env.AZURE_AD_CLIENT_ID!,
        clientSecret: env.AZURE_AD_CLIENT_SECRET!,
        tenantId: env.AZURE_AD_TENANT_ID!,
        redirectUri: env.AZURE_AD_REDIRECT_URI!,
        scopes: env.AZURE_AD_SCOPES.split(' ')
      });
      logger.info('Azure AD client initialized successfully');
    } else {
      logger.warn('Azure AD SSO is not configured or disabled');
    }
  } catch (error) {
    logger.error('Failed to initialize Azure AD client', { error });
  }
})();

// Middleware to check if Azure AD is enabled
const requireAzureAdEnabled = (req: Request, res: Response, next: NextFunction) => {
  if (!isAzureAdConfigured()) {
    return res.status(404).json({
      success: false,
      message: 'Azure AD authentication is not configured or disabled'
    });
  }
  next();
};

// Route to initiate login with Azure AD
router.get('/login', requireAzureAdEnabled, (req: Request, res: Response) => {
  try {
    // Create authorization URL with PKCE
    const { url, state } = createAuthorizationUrl({
      clientId: env.AZURE_AD_CLIENT_ID!,
      clientSecret: env.AZURE_AD_CLIENT_SECRET!,
      tenantId: env.AZURE_AD_TENANT_ID!,
      redirectUri: env.AZURE_AD_REDIRECT_URI!,
      scopes: env.AZURE_AD_SCOPES.split(' ')
    });
    
    // Store state in session for validation
    if (req.session) {
      req.session.azureAdState = state;
    }
    
    logger.info('Redirecting to Azure AD for authentication', { redirectUrl: url });
    res.redirect(url);
  } catch (error) {
    logger.error('Failed to create Azure AD authorization URL', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Azure AD login'
    });
  }
});

// Callback route for Azure AD
router.get('/callback', requireAzureAdEnabled, async (req: Request, res: Response) => {
  try {
    // Verify state parameter to prevent CSRF
    const { state } = req.query as { state: string };
    const storedState = req.session?.azureAdState;
    
    if (!state || !storedState || state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    
    // Clear session state
    if (req.session) {
      delete req.session.azureAdState;
    }
    
    // Get authorization code and exchange for tokens
    const tokenSet = await handleCallback(req, {
      clientId: env.AZURE_AD_CLIENT_ID!,
      clientSecret: env.AZURE_AD_CLIENT_SECRET!,
      tenantId: env.AZURE_AD_TENANT_ID!,
      redirectUri: env.AZURE_AD_REDIRECT_URI!,
      scopes: env.AZURE_AD_SCOPES.split(' ')
    });
    
    // Get user info from tokens
    const azureAdUser = await getUserInfo(tokenSet);
    
    // Find or create user in our database
    const user = await findOrCreateUser(azureAdUser);
    
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
      logger.info('New user created from Azure AD login', { 
        userId: user.id, 
        email: user.email 
      });
    } else {
      logger.info('Existing user logged in with Azure AD', { 
        userId: user.id, 
        email: user.email 
      });
    }
    
    // Redirect with token as URL fragment
    // This is a common pattern for SPA authentication flows
    // The client-side app will read the token from the URL fragment
    const frontendUrl = new URL(env.API_URL || 'http://localhost:3000');
    frontendUrl.pathname = '/auth/azure/complete';
    frontendUrl.hash = `token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    
    res.redirect(frontendUrl.toString());
  } catch (error) {
    logger.error('Azure AD authentication callback error', { error });
    
    // Redirect to error page
    const frontendUrl = new URL(env.API_URL || 'http://localhost:3000');
    frontendUrl.pathname = '/auth/azure/error';
    res.redirect(frontendUrl.toString());
  }
});

// Route to check if Azure AD is enabled and configured
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    enabled: isAzureAdConfigured()
  });
});

export default router;