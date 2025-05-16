import { Router } from "express";
import { OIDCStrategy } from "passport-azure-ad";
import passport from "passport";
import { storage } from "../storage";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

const router = Router();

// Check if Microsoft Entra ID is configured properly
const isMicrosoftEntraConfigured = () => {
  return Boolean(
    process.env['ENTRA_ID_CLIENT_ID'] &&
    process.env['ENTRA_ID_CLIENT_SECRET'] &&
    process.env['ENTRA_ID_TENANT_ID']
  );
};

// Log whether Microsoft Entra ID is configured
if (isMicrosoftEntraConfigured()) {
  logger.info("Microsoft Entra ID integration is configured and enabled");
} else {
  logger.warn("Microsoft Entra ID integration is not configured - SSO login will be disabled");
}

// Only configure Microsoft Entra ID if we have the required credentials
if (isMicrosoftEntraConfigured()) {
  // Load environment variables for Microsoft Entra ID (Azure AD)
  const msalConfig = {
    clientID: process.env['ENTRA_ID_CLIENT_ID'],
    clientSecret: process.env['ENTRA_ID_CLIENT_SECRET'],
    tenantID: process.env['ENTRA_ID_TENANT_ID'],
    redirectUrl: process.env['ENTRA_ID_REDIRECT_URI'] || `${process.env['BASE_URL']}/api/auth/entra/callback`,
    identityMetadata: `https://login.microsoftonline.com/${process.env['ENTRA_ID_TENANT_ID']}/v2.0/.well-known/openid-configuration`,
    responseType: "code id_token",
    responseMode: "form_post",
    scope: ["openid", "profile", "email", "offline_access"],
    allowHttpForRedirectUrl: process.env['NODE_ENV'] !== "production",
  };

  // Configure Microsoft Entra ID (Azure AD) strategy
  passport.use(
    "azuread-openidconnect",
    new OIDCStrategy(
      {
        identityMetadata: msalConfig.identityMetadata,
        clientID: msalConfig.clientID!,
        responseType: msalConfig.responseType,
        responseMode: msalConfig.responseMode,
        redirectUrl: msalConfig.redirectUrl,
        allowHttpForRedirectUrl: msalConfig.allowHttpForRedirectUrl,
        clientSecret: msalConfig.clientSecret,
        validateIssuer: true,
        issuer: [`https://login.microsoftonline.com/${msalConfig.tenantID}/v2.0`],
        passReqToCallback: false,
        scope: msalConfig.scope,
      },
      async (profile: any, done: any) => {
        try {
          logger.info("Microsoft login attempt", { email: profile._json.email });
          
          if (!profile._json.email) {
            return done(new Error("No email found in profile"), null);
          }

          // Check if user exists with this email
          let user = await storage.getUserByEmail(profile._json.email);

          // If user doesn't exist, create one
          if (!user) {
            // Generate a random username based on email prefix
            const emailPrefix = profile._json.email.split("@")[0];
            const randomSuffix = Math.floor(Math.random() * 10000);
            const username = `${emailPrefix}_${randomSuffix}`;
            
            // Create a new user
            user = await storage.createUser({
              username,
              email: profile._json.email,
              password: uuidv4(), // random password as user will log in with Microsoft
              firstName: profile._json.given_name || null,
              lastName: profile._json.family_name || null,
              role: "user", // Default role
              entraSsoId: profile.oid || profile.sub, // Store the Microsoft ID
            });
            
            logger.info("Created new user via Microsoft SSO", { username, email: profile._json.email });
          } 
          // If user exists but doesn't have entraSsoId linked, update it
          else if (user && !user.entraSsoId) {
            user = await storage.updateUser(user.id, {
              entraSsoId: profile.oid || profile.sub,
              firstName: profile._json.given_name || user.firstName,
              lastName: profile._json.family_name || user.lastName,
            });
            
            logger.info("Updated user with Microsoft SSO ID", { username: user.username });
          }
          
          return done(null, user);
        } catch (error) {
          logger.error("Error in Microsoft authentication", { error });
          return done(error);
        }
      }
    )
  );

  // Routes for Microsoft Entra ID (Azure AD) authentication
  router.get(
    "/microsoft",
    (req, res, next) => {
      if (!isMicrosoftEntraConfigured()) {
        return res.status(404).json({ message: "Microsoft Entra ID is not configured" });
      }
      next();
    },
    passport.authenticate("azuread-openidconnect", { 
      prompt: "select_account",
      failureRedirect: "/auth/signin",
    })
  );

  router.post(
    "/microsoft/callback",
    (req, res, next) => {
      if (!isMicrosoftEntraConfigured()) {
        return res.status(404).json({ message: "Microsoft Entra ID is not configured" });
      }
      next();
    },
    passport.authenticate("azuread-openidconnect", { 
      failureRedirect: "/auth/signin",
      failureFlash: true,
    }),
    (req, res) => {
      // Successful authentication, redirect home
      res.redirect("/");
    }
  );
}

// Status endpoint to check if Microsoft authentication is configured
router.get("/microsoft/status", (req, res) => {
  res.json({
    enabled: isMicrosoftEntraConfigured(),
    message: isMicrosoftEntraConfigured() 
      ? "Microsoft Entra ID integration is enabled" 
      : "Microsoft Entra ID integration is not configured"
  });
});

export default router;