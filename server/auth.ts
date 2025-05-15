import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt with a random salt
 * @param password The plain text password to hash
 * @returns A string in the format `hash.salt` for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a supplied password with a stored hashed password
 * @param supplied The plain text password supplied by the user
 * @param stored The stored password hash in the format `hash.salt`
 * @returns A boolean indicating if the passwords match
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // Handle missing or undefined inputs
    if (!supplied || !stored) {
      console.error("Missing password inputs");
      return false;
    }
    
    // Check if the stored password is in the correct format
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.error("Invalid stored password format");
      return false;
    }
    
    const [hashed, salt] = parts;
    if (!hashed || !salt) {
      console.error("Missing hash or salt components");
      return false;
    }
    
    try {
      // Create buffer from stored hash
      const hashedBuf = Buffer.from(hashed, "hex");
      
      // Hash the supplied password with the same salt
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      
      // Verify buffers are valid
      if (!hashedBuf || !suppliedBuf) {
        console.error("Invalid buffer generation");
        return false;
      }
      
      // Convert to same format before comparison
      const hashedHex = hashedBuf.toString('hex');
      const suppliedHex = suppliedBuf.toString('hex');
      
      // Simple string comparison for backup if timing-safe equality fails
      if (hashedHex === suppliedHex) {
        return true;
      }
      
      // If buffers are different lengths, they're definitely not equal
      if (hashedBuf.length !== suppliedBuf.length) {
        console.error(`Buffer length mismatch: ${hashedBuf.length} vs ${suppliedBuf.length}`);
        return false;
      }
      
      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error("Error in password comparison:", error);
      return false;
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

/**
 * Set up the authentication system
 * @param app The Express application
 */
export function setupAuth(app: Express): void {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env["SESSION_SECRET"] || "developmentsecret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if username exists
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Verify password
        try {
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            console.log('Password comparison failed');
            return done(null, false, { message: 'Invalid username or password' });
          }
          
          // Valid credentials
          return done(null, user);
        } catch (passwordError) {
          console.error('Password comparison error:', passwordError);
          return done(null, false, { message: 'Error validating credentials' });
        }
      } catch (error) {
        console.error('Login strategy error:', error);
        return done(error);
      }
    }),
  );

  // Serialize user to session
  passport.serializeUser((user, done) => done(null, user.id));

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register API endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate required fields
      if (!req.body.username || !req.body.password || !req.body.email) {
        return res.status(400).json({ 
          success: false,
          message: "Username, password, and email are required" 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Username already exists" 
        });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: "Email already exists" 
        });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log in the newly created user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ 
            success: false, 
            message: "User created but login failed" 
          });
        }
        return res.status(201).json({
          success: true,
          user
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred during registration" 
      });
    }
  });

  // Login API endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      // Make sure we have username and password in the request
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required" 
        });
      }
      
      passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ 
            success: false, 
            message: "An error occurred during authentication" 
          });
        }
        
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: info?.message || "Invalid username or password" 
          });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.status(500).json({ 
              success: false, 
              message: "An error occurred during login" 
            });
          }
          
          return res.status(200).json({
            success: true,
            user
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected login error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "An unexpected error occurred" 
      });
    }
  });

  // Logout API endpoint
  app.post("/api/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({
        success: true,
        message: "Already logged out"
      });
    }
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred during logout"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Get current user API endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    return res.status(200).json({
      success: true,
      user: req.user
    });
  });
}

/**
 * Middleware to check if a user is authenticated
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * Middleware to check if a user is a superadmin
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function isSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && req.user?.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Requires superadmin privileges" });
}

/**
 * Middleware to check if a user has specific role(s)
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
export function authorize(roles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If no roles specified, just require authentication
    if (roles.length === 0) {
      return next();
    }

    // Check if user has one of the required roles
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Forbidden: You don't have the required role to access this resource" 
      });
    }

    return next();
  };
}

// Import the token-related functions
import { generateToken, TokenType, verifyToken as verifyJwtToken, revokeToken as revokeJwtToken } from './utils/jwtConfig';
import crypto from 'crypto';

/**
 * Generate a user token (access and refresh tokens)
 * @param user User object to include in the token
 * @returns Object containing access and refresh tokens
 */
export function generateUserToken(user: any) {
  // Create a safe payload (remove sensitive data)
  const userPayload = {
    id: user.id,
    username: user.username,
    email: user.email || '',
    role: user.role || 'user'
  };

  // Generate an access token
  const accessToken = generateToken(userPayload, TokenType.ACCESS);
  
  // Generate a refresh token
  const refreshToken = generateToken(userPayload, TokenType.REFRESH);

  return { accessToken, refreshToken };
}

/**
 * Generate a reset token for password reset
 * @returns A random token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiry time for reset tokens
 * @param hours Number of hours until expiry (default: 1)
 * @returns ISO date string of expiry time
 */
export function calculateExpiryTime(hours: number = 1): string {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hours);
  return expiryDate.toISOString();
}