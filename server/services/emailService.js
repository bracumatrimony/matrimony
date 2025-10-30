const nodemailer = require("nodemailer");

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App password, not regular password
  },
});

// Email templates
const emailTemplates = {
  biodataApproved: (userName) => ({
    subject: "Your BRACU Matrimony Biodata Has Been Approved",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile Approved</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
            min-height: 100vh;
            padding: 20px;
          }

          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
          }

          .header {
            background: #e11d48;
            padding: 32px 30px;
            text-align: center;
            color: white;
          }

          .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }

          .tagline {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 400;
          }

          .content {
            padding: 40px 30px;
          }

          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }

          .status-card {
            background: #f0fdf4;
            border: 1px solid #22c55e;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }

          .status-title {
            font-size: 16px;
            font-weight: 600;
            color: #166534;
            margin-bottom: 6px;
          }

          .status-text {
            color: #15803d;
            font-size: 14px;
            line-height: 1.5;
          }

          .message {
            font-size: 15px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 20px;
          }

          .tips-section {
            background: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }

          .tips-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }

          .tips-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .tips-list li {
            color: #4b5563;
            margin-bottom: 6px;
            padding-left: 16px;
            position: relative;
            font-size: 14px;
          }

          .tips-list li:before {
            content: "•";
            color: #6b7280;
            font-weight: bold;
            position: absolute;
            left: 0;
          }

          .cta-button {
            display: inline-block;
            background: #e11d48;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #e11d48;
            transition: all 0.2s ease;
          }

          .cta-button:hover {
            background: #be185d;
            border-color: #be185d;
          }

          .footer {
            background: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }

          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.5;
          }

          @media (max-width: 600px) {
            body {
              padding: 10px;
            }

            .header {
              padding: 24px 20px;
            }

            .content {
              padding: 30px 20px;
            }

            .status-card {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">BRACU Matrimony</div>
          </div>

          <div class="content">
            <div class="greeting">Dear ${userName},</div>

            <div class="status-card">
              <div class="status-title">Profile Approval Confirmed</div>
              <div class="status-text">Your biodata has been reviewed and approved. Your profile is now live and visible to other members.</div>
            </div>

            <div class="message">
              Congratulations on completing the approval process. Your profile is now active on BRACU Matrimony, where you can connect with other members of the BRACU community who share similar values and backgrounds.
            </div>

            <div class="message">
              Make sure your profile information remains up to date and accurate. Also, be aware that you may receive messages from interested members through the contact information you have provided.
            </div>

            <div style="text-align: center;">
              <a href="${
                process.env.FRONTEND_URL || "https://campusmatrimony.vercel.app"
              }/profile" class="cta-button" style="color: white !important;">
                View My Profile
              </a>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <p class="footer-copyright">© ${new Date().getFullYear()} BRACU Matrimony. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  biodataRejected: (userName, reason) => ({
    subject: "Your BRACU Matrimony Biodata Has Been Rejected",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Biodata Rejected</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
            min-height: 100vh;
            padding: 20px;
          }

          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
          }

          .header {
            background: #e11d48;
            padding: 32px 30px;
            text-align: center;
            color: white;
          }

          .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }

          .tagline {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 400;
          }

          .content {
            padding: 40px 30px;
          }

          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }

          .status-card {
            background: #fef2f2;
            border: 1px solid #dc2626;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }

          .status-title {
            font-size: 16px;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 6px;
          }

          .status-text {
            color: #dc2626;
            font-size: 14px;
            line-height: 1.5;
          }

          .message {
            font-size: 15px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 20px;
          }

          .tips-section {
            background: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }

          .tips-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }

          .tips-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .tips-list li {
            color: #4b5563;
            margin-bottom: 6px;
            padding-left: 16px;
            position: relative;
            font-size: 14px;
          }

          .tips-list li:before {
            content: "•";
            color: #6b7280;
            font-weight: bold;
            position: absolute;
            left: 0;
          }

          .cta-button {
            display: inline-block;
            background: #e11d48;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #e11d48;
            transition: all 0.2s ease;
          }

          .cta-button:hover {
            background: #be185d;
            border-color: #be185d;
          }

          .footer {
            background: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }

          .footer-text {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.5;
          }

          @media (max-width: 600px) {
            body {
              padding: 10px;
            }

            .header {
              padding: 24px 20px;
            }

            .content {
              padding: 30px 20px;
            }

            .status-card {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">BRACU Matrimony</div>
          </div>

          <div class="content">
            <div class="greeting">Dear ${userName},</div>

            <div class="status-card">
              <div class="status-title">Biodata Rejected</div>
              <div class="status-text">Your biodata has been reviewed and rejected for the following reason: ${
                reason || "No specific reason provided"
              }</div>
            </div>

            <div class="message">
              We regret to inform you that your profile could not be approved at this time. Please review the rejection reason above and make the necessary corrections to your biodata.
            </div>

            <div style="text-align: center;">
              <a href="https://campusmatrimony.vercel.app/profile/edit" class="cta-button" style="color: white !important;">
                Edit My Profile
              </a>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <p class="footer-copyright">© ${new Date().getFullYear()} BRACU Matrimony. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async (to, templateName, userName, ...additionalParams) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const emailContent = template(userName, ...additionalParams);

    const mailOptions = {
      from: `"BRACU Matrimony" <${process.env.GMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
