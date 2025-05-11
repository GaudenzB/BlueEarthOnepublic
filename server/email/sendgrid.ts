import { MailService } from '@sendgrid/mail';
import { logger } from '../utils/logger';

/**
 * SendGrid Email Integration
 * 
 * This module handles sending transactional emails via SendGrid.
 * It includes templating support and structured error reporting.
 */

// Configuration constants
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'support@blueearth.capital';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'BlueEarth Capital';

// Set up SendGrid client
const mailService = new MailService();
if (SENDGRID_API_KEY) {
  mailService.setApiKey(SENDGRID_API_KEY);
  logger.info('SendGrid email service initialized');
} else {
  logger.warn('SENDGRID_API_KEY not set. Email functionality will be disabled.');
}

// Email interface
export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: {
    content: string;
    filename: string;
    type: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
  }[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      logger.error('SendGrid API key is not set. Email not sent.', { 
        recipient: params.to, 
        subject: params.subject 
      });
      return false;
    }

    // Prepare email data
    const emailData = {
      to: params.to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      attachments: params.attachments,
      cc: params.cc,
      bcc: params.bcc,
      replyTo: params.replyTo
    };

    // Send email
    await mailService.send(emailData);
    
    logger.info('Email sent successfully', { 
      recipient: params.to,
      subject: params.subject,
      templateId: params.templateId || 'none'
    });
    
    return true;
  } catch (error: any) {
    // Structured error logging
    const errorDetails = {
      recipient: params.to,
      subject: params.subject,
      errorMessage: error.message,
      errorCode: error.code,
      errorResponse: error.response?.body || null
    };
    
    logger.error('SendGrid email error', errorDetails);
    
    // Rate limiting handling advice
    if (error.code === 429) {
      logger.warn('SendGrid rate limit reached. Consider implementing a queue system for emails.');
    }
    
    return false;
  }
}

/**
 * Email Templates
 * 
 * In a production environment, we would use SendGrid's template system
 * with template IDs. For now, we'll use these functions to generate templates.
 */

/**
 * Generate password reset email HTML
 */
function generatePasswordResetTemplate(resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A1A; background-color: #F9FAFB; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 20px;">
        <img src="https://blueearth.capital/logo.png" alt="BlueEarth Capital" style="max-width: 200px; height: auto;">
        <h2 style="color: #1A2B47; margin-top: 16px;">Reset Your Password</h2>
      </div>
      
      <div style="background-color: white; padding: 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p>Hello,</p>
        <p>We received a request to reset your password for the BlueEarth Capital Employee Portal. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1A2B47; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #324D6F; padding: 12px; background-color: #F5F7FA; border-radius: 4px; font-family: monospace; font-size: 14px;">${resetLink}</p>
        
        <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      </div>
      
      <div style="margin-top: 24px; text-align: center;">
        <p>If you have any questions, please contact your administrator.</p>
        
        <p style="margin-top: 16px;">Thank you,<br><strong>BlueEarth Capital IT Team</strong></p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center;">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} BlueEarth Capital. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Generate plain text version of password reset email
 */
function generatePasswordResetText(resetLink: string): string {
  return `
Reset Your Password - BlueEarth Capital

Hello,

We received a request to reset your password for the BlueEarth Capital Employee Portal. If you didn't make this request, you can safely ignore this email.

To reset your password, click or copy the link below:

${resetLink}

Important: This link will expire in 1 hour for security reasons.

If you have any questions, please contact your administrator.

Thank you,
BlueEarth Capital IT Team

This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} BlueEarth Capital. All rights reserved.
  `.trim();
}

/**
 * Send password reset email
 * 
 * @param email Recipient email address
 * @param resetToken Reset token (not used in the email but included for logging)
 * @param resetLink Full URL to reset password
 * @returns Success status
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, resetLink: string): Promise<boolean> {
  logger.info('Sending password reset email', { email, resetTokenLength: resetToken.length });
  
  const subject = 'BlueEarth Capital - Password Reset';
  const html = generatePasswordResetTemplate(resetLink);
  const text = generatePasswordResetText(resetLink);
  
  // In production, we would use SendGrid templates:
  // return await sendEmail({
  //   to: email,
  //   subject,
  //   templateId: 'd-xxxxxxxxxxxxxxxxxxxxxx',
  //   dynamicTemplateData: {
  //     resetLink,
  //     currentYear: new Date().getFullYear()
  //   }
  // });
  
  return await sendEmail({
    to: email,
    subject,
    html,
    text
  });
}