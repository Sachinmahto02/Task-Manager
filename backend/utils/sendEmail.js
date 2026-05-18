const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter.
 * Uses Gmail by default. For other providers set EMAIL_HOST / EMAIL_PORT.
 */
const createTransporter = () => {
  // If explicit SMTP host is given (e.g. SendGrid, Mailgun)
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  // Default: Gmail with App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth:    { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

/**
 * sendEmail({ to, subject, html })
 * Throws on failure so the caller can catch and respond accordingly.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from:    process.env.EMAIL_FROM || `ZenFlow Journal <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to} — Message ID: ${info.messageId}`);
  return info;
};

// ── Email templates ────────────────────────────────────────────────────────────

const passwordResetTemplate = (name, resetUrl, expiryMinutes = 30) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password — ZenFlow</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', system-ui, sans-serif; background: #f0f2f8; color: #1a1d3a; }
    .wrapper { max-width: 580px; margin: 40px auto; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header {
      background: linear-gradient(135deg, #7c6ef0 0%, #5b8dee 100%);
      padding: 36px 40px; text-align: center;
    }
    .header-logo { font-size: 2rem; margin-bottom: 8px; }
    .header h1 { color: #ffffff; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .header p { color: rgba(255,255,255,0.75); font-size: 0.9rem; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { font-size: 1.05rem; font-weight: 600; margin-bottom: 12px; }
    .text { color: #4a4f7a; font-size: 0.92rem; line-height: 1.7; margin-bottom: 16px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #7c6ef0, #5b8dee);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 1rem;
      padding: 14px 36px;
      border-radius: 10px;
      letter-spacing: 0.02em;
    }
    .expiry-box {
      background: #fff8ed;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #92400e;
      margin-bottom: 24px;
      display: flex; align-items: center; gap: 8px;
    }
    .url-box {
      background: #f5f5ff;
      border: 1px solid #e0ddff;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.75rem;
      color: #6b7280;
      word-break: break-all;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .divider { height: 1px; background: #eef0f8; margin: 24px 0; }
    .footer { background: #f8f9ff; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 0.78rem; color: #9ca3af; line-height: 1.6; }
    .security-note { font-size: 0.82rem; color: #9ca3af; margin-top: 8px; line-height: 1.6; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">✦</div>
      <h1>Password Reset Request</h1>
      <p>ZenFlow Journal</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hi ${name},</p>
      <p class="text">
        We received a request to reset the password for your ZenFlow account.
        If you made this request, click the button below to set a new password.
      </p>

      <div class="expiry-box">
        ⏱ This link will expire in <strong>&nbsp;${expiryMinutes} minutes</strong>.
      </div>

      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset My Password →</a>
      </div>

      <p class="text">If the button doesn't work, copy and paste this URL into your browser:</p>
      <div class="url-box">${resetUrl}</div>

      <div class="divider"></div>

      <p class="security-note">
        🔒 If you did <strong>not</strong> request a password reset, you can safely ignore this email.
        Your password will remain unchanged and this link will expire automatically.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This email was sent by <strong>ZenFlow Journal</strong>.<br/>
      Please do not reply to this automated message.</p>
    </div>
  </div>
</div>
</body>
</html>
`;

const welcomeTemplate = (name, loginUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Welcome to ZenFlow!</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f0f2f8; color: #1a1d3a; }
    .wrapper { max-width: 560px; margin: 40px auto; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #7c6ef0, #5b8dee); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 1.6rem; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 4px; }
    .body { padding: 40px; }
    .text { color: #4a4f7a; font-size: 0.92rem; line-height: 1.7; margin-bottom: 16px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c6ef0, #5b8dee); color: #fff !important; text-decoration: none; font-weight: 700; padding: 14px 36px; border-radius: 10px; }
    .footer { background: #f8f9ff; padding: 20px 40px; text-align: center; font-size: 0.78rem; color: #9ca3af; }
  </style>
</head>
<body>
<div class="wrapper"><div class="card">
  <div class="header"><h1>Welcome to ZenFlow ✦</h1><p>Your personal journal & productivity hub</p></div>
  <div class="body">
    <p class="text">Hi <strong>${name}</strong>, your account is ready. Start writing, tracking tasks, and building daily habits.</p>
    <div class="btn-wrap"><a href="${loginUrl}" class="btn">Open My Dashboard →</a></div>
  </div>
  <div class="footer"><p>© ZenFlow Journal — sent automatically.</p></div>
</div></div>
</body>
</html>
`;

module.exports = { sendEmail, passwordResetTemplate, welcomeTemplate };
