const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.eu-north-1.amazonaws.com",
  port: 587,
  secure: false, // implicit SSL — required on Render (port 587 is blocked)
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000
});

module.exports = async function sendEmail({
  to,
  subject,
  html,
  text,
 
}) {
  try {
    const info = await transporter.sendMail({
      from: '"Kabacu" <verified@kabacu.com>',
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