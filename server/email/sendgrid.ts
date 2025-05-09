import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (SENDGRID_API_KEY) {
  mailService.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key is not set. Email not sent.');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: 'support@blueearth.capital', // Update this to your verified sender
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, resetLink: string): Promise<boolean> {
  const subject = 'BlueEarth Capital - Password Reset';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A1A;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1A2B47;">Reset Your Password</h2>
      </div>
      <p>Hello,</p>
      <p>We received a request to reset your password for the BlueEarth Capital Employee Portal. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #1A2B47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #324D6F;">${resetLink}</p>
      
      <p>This link will expire in 1 hour.</p>
      
      <p>If you have any questions, please contact your administrator.</p>
      
      <p>Thank you,<br>BlueEarth Capital IT Team</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    html,
  });
}