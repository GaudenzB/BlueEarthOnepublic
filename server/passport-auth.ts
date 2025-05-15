import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { logger } from './utils/logger';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up Passport authentication
  // Note: Session middleware is already set up in app.use(setupSession)
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          logger.debug(`Authentication failed: user ${username} not found`);
          return done(null, false);
        }
        
        if (!(await comparePasswords(password, user.password))) {
          logger.debug(`Authentication failed: invalid password for ${username}`);
          return done(null, false);
        }
        
        logger.info(`User ${username} logged in successfully`);
        return done(null, user);
      } catch (error) {
        logger.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  // Tell Passport how to serialize the user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Tell Passport how to deserialize the user
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      logger.error('Error deserializing user:', error);
      done(error);
    }
  });

  // Define registration route
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password and create user
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user info without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  });

  // Define login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        logger.error('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session persistence based on "remember me" option
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Return user info without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Define logout route
  app.post("/api/logout", (req, res, next) => {
    // Use the logout method provided by Passport
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Define route to get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user info without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Development-only routes
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/dev-login", async (req, res) => {
      try {
        // Get first admin user or create one if none exists
        let adminUser = await storage.getUserByUsername('admin');
        
        if (!adminUser) {
          // Create admin user if it doesn't exist
          adminUser = await storage.createUser({
            username: 'admin',
            email: 'admin@example.com',
            password: await hashPassword('admin'),
            role: 'SUPER_ADMIN',
            firstName: 'Admin',
            lastName: 'User',
            active: true
          });
          logger.info('Created default admin user for development');
        }

        // Log in as admin
        req.login(adminUser, (err) => {
          if (err) {
            logger.error('Dev login error:', err);
            return res.status(500).json({ message: "Failed to login" });
          }
          
          const { password, ...userWithoutPassword } = adminUser;
          res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        logger.error('Dev login error:', error);
        res.status(500).json({ message: "Internal server error during dev login" });
      }
    });
  }
}