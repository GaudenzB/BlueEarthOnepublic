import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import microsoftAuthRouter from "./auth/microsoft";

// Type for token payload used for authentication
export interface UserTokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Role-based access control middleware
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: Requires superadmin role" });
  }
  next();
}

export function isAdminOrHigher(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "superadmin" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Requires admin or superadmin role" });
  }
  next();
}

// Permission-based authorization middleware
export function authorize(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Super admins have access to everything
    if (req.user.role === "superadmin") {
      return next();
    }
    
    // For regular users, perform permission check
    // Here we would typically check the user's permissions from the database
    // For simplicity, we're allowing access to admins for all permissions
    if (req.user.role === "admin") {
      return next();
    }
    
    // For other roles, we would check specific permissions
    // Placeholder for actual permission check
    return res.status(403).json({ message: `Forbidden: Insufficient permissions for ${permission}` });
  };
}

// Generate JWT tokens for user authentication
export function generateUserToken(payload: UserTokenPayload) {
  // Get token secrets and expiry times from environment variables or use defaults
  const accessTokenSecret = process.env.JWT_SECRET || 'access-token-secret';
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-token-secret';
  
  // Get token expiry times (in seconds)
  const accessTokenExpiry = parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS || '3600', 10);
  const refreshTokenExpiry = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS || '604800', 10);
  
  // Create tokens
  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiry
  });
  
  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiry
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpiry
  };
}

const scryptAsync = promisify(scrypt);

// Securely hash password with scrypt
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Verify password against stored hash
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Alias for compatibility with existing code
export const comparePassword = comparePasswords;

export function setupAuth(app: Express) {
  // Check if session secret is set
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET not set, using a random secret (not secure for production)");
    process.env.SESSION_SECRET = randomBytes(32).toString("hex");
  }
  
  try {
    // Configure session middleware
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "fallback-secret-dev-only",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
        store: storage.sessionStore
      })
    );

    // Initialize Passport and restore authentication state from session
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log("Passport and session middleware configured successfully");
  } catch (error) {
    console.error("Error setting up auth middleware:", error);
    throw error;
  }

  // Configure Passport.js with local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize user to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Initialize Passport.js and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes for authentication
  // Register new user
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Also check email
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log in the user automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Login with username/password
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Use Microsoft Entra auth routes
  app.use("/api/auth", microsoftAuthRouter);
}