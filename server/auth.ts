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
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
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
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
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
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log in the newly created user
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      return next(error);
    }
  });

  // Login API endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, _info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout API endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user API endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    return res.json(req.user);
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