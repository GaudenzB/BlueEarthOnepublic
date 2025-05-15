/**
 * Authentication controller
 * 
 * Handles user authentication operations like login, registration,
 * password reset, and logout functionality.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';
import { comparePassword, generateUserToken, hashPassword } from '../auth';
import { revokeToken } from '../utils/jwtConfig';
import { errorHandling } from '../utils/errorHandling';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { apiResponse } from '../utils/apiResponse';
import { setAuthCookies, clearAuthCookies } from '../utils/cookieManager';
const { wrapHandler } = errorHandling;
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../email/sendgrid';
import { 
  userLoginSchema, 
  userRegistrationSchema, 
  passwordResetRequestSchema,
  passwordResetSchema 
} from '@shared/validation/user';

/**
 * Login endpoint handler
 * Validates credentials and returns a JWT token if successful
 */
const login = errorHandling.wrapHandler(async (req: Request, res: Response) => {
  // Request body is validated by our validation schema
  const loginData = userLoginSchema.parse(req.body);
  
  // Find user by username
  const user = await storage.getUserByUsername(loginData.username);
  if (!user) {
    // Use a generic error message to prevent username enumeration
    logger.info({ 
      event: "failed_login_attempt",
      username: loginData.username, 
      reason: "user_not_found"
    });
    // Use our error handling
    throw new ApiError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
  }
  
  // Check if user is active
  if (!user.active) {
    logger.info({ 
      event: "failed_login_attempt", 
      username: loginData.username, 
      userId: user.id,
      reason: "account_deactivated"
    });
    throw new ApiError("Your account has been deactivated", 401, "AUTH_ACCOUNT_DEACTIVATED");
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(loginData.password, user.password);
  if (!isPasswordValid) {
    logger.info({ 
      event: "failed_login_attempt", 
      username: loginData.username, 
      userId: user.id,
      reason: "invalid_password" 
    });
    throw new ApiError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateUserToken(user);
  
  // Set authentication cookies
  setAuthCookies(res, accessToken, refreshToken);
  
  // Store user information in session for session-based auth fallback
  if (req.session) {
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.userRole = user.role;
    logger.debug('User session data stored', { userId: user.id });
  }
  
  // Log successful login
  logger.info({ 
    event: "successful_login", 
    username: user.username, 
    userId: user.id 
  });
  
  // Return success with user info but no token in response body
  return apiResponse.success(res, { 
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  }, "Login successful");
});

/**
 * Register endpoint handler
 * Creates a new user account
 */
const register = errorHandling.wrapHandler(async (req: Request, res: Response) => {
  // Validate registration data
  const registrationData = userRegistrationSchema.parse(req.body);
  
  // Check if username already exists
  const existingUsername = await storage.getUserByUsername(registrationData.username);
  if (existingUsername) {
    throw new ApiError("Username already exists", 409, "AUTH_USERNAME_EXISTS");
  }
  
  // Check if email already exists
  if (registrationData.email) {
    const existingEmail = await storage.getUserByEmail(registrationData.email);
    if (existingEmail) {
      throw new ApiError("Email already exists", 409, "AUTH_EMAIL_EXISTS");
    }
  }
  
  // Hash password
  const hashedPassword = await hashPassword(registrationData.password);
  
  // Create user with hashed password (omit confirmPassword field)
  const { confirmPassword, ...userData } = registrationData;
  
  const newUser = await storage.createUser({
    ...userData,
    password: hashedPassword,
    role: 'user', // Default role for new registrations
  });
  
  // Log successful registration
  logger.info({ 
    event: "user_registered", 
    username: newUser.username, 
    userId: newUser.id 
  });
  
  // Generate tokens for auto-login
  const { accessToken, refreshToken } = generateUserToken(newUser);
  
  // Set authentication cookies
  setAuthCookies(res, accessToken, refreshToken);
  
  // Store user information in session for session-based auth fallback
  if (req.session) {
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.email = newUser.email;
    req.session.userRole = newUser.role;
    logger.debug('User session data stored for new registration', { userId: newUser.id });
  }
  
  // Return success with user info but no token in response body
  return apiResponse.created(res, {
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    }
  }, "Registration successful");
});

/**
 * Logout endpoint handler
 * Revokes the current JWT token and clears authentication cookies
 */
const logout = errorHandling.wrapHandler(async (req: Request, res: Response) => {
  // Extract token from request
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Revoke the token
    revokeToken(token);
    
    // Log logout
    logger.info({ 
      event: "logout", 
      userId: (req as any).user?.id 
    });
  }
  
  // Clear authentication cookies
  clearAuthCookies(res);
  
  // Clear session data
  if (req.session) {
    // Delete user-related session data
    delete req.session.userId;
    delete req.session.username;
    delete req.session.email;
    delete req.session.userRole;
    
    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Error regenerating session during logout', { error: err });
      }
    });
  }
  
  return apiResponse.success(res, null, "Logout successful");
});

/**
 * Gets current user information
 */
const getCurrentUser = wrapHandler(async (req: Request, res: Response) => {
  // Get user ID from authenticated request
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new ApiError("Unauthorized", 401, "AUTH_UNAUTHORIZED");
  }
  
  // Fetch user from storage
  const user = await storage.getUser(userId);
  
  if (!user) {
    throw new ApiError("User not found", 404, "USER_NOT_FOUND");
  }
  
  // Return user information (omit sensitive data)
  return apiResponse.success(res, {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt
  });
});

/**
 * Request password reset
 * Sends a password reset email
 */
const forgotPassword = wrapHandler(async (req: Request, res: Response) => {
  // Validate request data
  const data = passwordResetRequestSchema.parse(req.body);
  
  // Check if user exists with this email
  const user = await storage.getUserByEmail(data.email);
  
  // We don't want to reveal if the email exists or not for security reasons
  // So we always return success, even if the email doesn't exist
  if (!user) {
    logger.info({ 
      event: "password_reset_request", 
      email: data.email,
      success: false,
      reason: "email_not_found"
    });
    
    // Return success even though we didn't send an email
    // This prevents email enumeration attacks
    return apiResponse.success(res, null, "If your email is registered, you will receive a password reset link shortly");
  }
  
  // Generate reset token and set expiry
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  
  // Save reset token to user record
  await storage.setResetToken(data.email, resetToken, expiresAt);
  
  // Create reset link
  const resetLink = `${data.resetUrl || 'https://portal.blueearthcapital.com'}/reset-password?token=${resetToken}`;
  
  // Send reset email
  const emailSent = await sendPasswordResetEmail(data.email, resetToken, resetLink);
  
  if (!emailSent) {
    logger.error({
      event: "password_reset_email_failure",
      email: data.email
    }, "Failed to send password reset email");
    
    // Don't expose this error to the user for security
    // Just log it and continue with success response
  }
  
  // Log successful reset request
  logger.info({
    event: "password_reset_requested",
    email: data.email,
    userId: user?.id
  });
  
  return apiResponse.success(res, null, "If your email is registered, you will receive a password reset link shortly");
});

/**
 * Reset password using token
 */
const resetPassword = wrapHandler(async (req: Request, res: Response) => {
  // Validate request data
  const data = passwordResetSchema.parse(req.body);
  
  // Find user by reset token
  const user = await storage.getUserByResetToken(data.token);
  
  if (!user) {
    logger.info({ 
      event: "password_reset_failure", 
      reason: "invalid_token",
      token: data.token
    });
    
    throw new ApiError("Invalid or expired reset token", 400, "RESET_TOKEN_INVALID");
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(data.password);
  
  // Update user password and clear reset token
  const success = await storage.resetUserPassword(user.id, hashedPassword);
  
  if (!success) {
    logger.error({ 
      event: "password_reset_failure", 
      reason: "db_update_error",
      userId: user.id 
    });
    throw new ApiError("Failed to reset password", 500, "RESET_SYSTEM_ERROR");
  }
  
  // Log password reset
  logger.info({ 
    event: "password_reset_success", 
    userId: user.id
  });
  
  return apiResponse.success(res, null, "Password has been reset successfully");
});

// Export controllers with named functions for easier debugging and logging
export const authController = {
  login,
  register,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};