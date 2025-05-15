// Type definition extension for express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
    username?: string;
    email?: string;
  }
}