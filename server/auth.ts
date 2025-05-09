import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "@shared/schema";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "blueearthcapital_secret_key";

// Function to hash a password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Function to compare a password with a hash
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Function to generate a JWT token
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

// Middleware to authenticate requests
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Role-based access control middleware
export const authorize = (roles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // If no roles are specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

// Superadmin authorization middleware
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: Superadmin access required" });
  }

  next();
};