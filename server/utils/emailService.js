const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Data Mall" <no-reply@datamall.com>',
    to: email,
    subject: 'Verify Your Email - OTP Verification Code',
    text: `Your OTP verification code is ${otp}. It will expire in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p>Thank you for registering. Please verify your email address by entering the following One-Time Password (OTP) code:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; color: #4A90E2; letter-spacing: 2px;">
          ${otp}
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  // If SMTP configs are not present, log OTP to console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n==================================================');
    console.log(`[SMTP NOT CONFIGURED] Email OTP for ${email}: ${otp}`);
    console.log('==================================================\n');
    return true;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};
