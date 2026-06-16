const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.eu-north-1.amazonaws.com",
  port: 587,
  secure: false, // TLS on port 587
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS
  }
});

module.exports = async function sendEmail({
  to,
  subject,
  html,
  text,
 
}) {
  try {
    const info = await transporter.sendMail({
      from: '"Salem Estate" <noreply@yourdomain.com>',
      to,
      subject,
      text,
      html,
   
    });

    console.log("Email sent:", info.messageId);

    return info;

  } catch (error) {
    console.error("SES EMAIL ERROR:", error);
    throw error;
  }
};