// const nodemailer = require("nodemailer");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// // Uses HTTPS (port 443) — not blocked by Render or any cloud host.
// // Requires AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars.
// // const sesClient = new SESClient({
// //   region: process.env.AWS_REGION || "eu-north-1",
// //   credentials: {
// //     accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
// //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// //   },
// // });

// // const transporter = nodemailer.createTransport({
// //   SES: { ses: sesClient, aws: { SendEmailCommand } },
// // });

// module.exports = async function sendEmail({ to, subject, html, text }) {
//   try {
//     const info = await transporter.sendMail({
//       from:    '"Kabacu" <verified@kabacu.com>',
//       to,
//       subject,
//       text,
//       html,
//     });

//     console.log("Email sent:", info.messageId);
//     return info;

//   } catch (error) {
//     console.error("SES EMAIL ERROR:", error);
//     throw error;
//   }
// };


const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// ✅ THIS IS CRITICAL
defaultClient.authentications["api-key"].apiKey =
  process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

module.exports = async function sendEmail({ to, subject, html, text }) {
  try {
    const email = {
      sender: {
        name: "Kabacu",
        email: "ecklujohn@gmail.com" // must be verified in Brevo
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    };

    const response = await apiInstance.sendTransacEmail(email);
    return response;

  } catch (error) {
    console.log("BREVO ERROR:");
    console.log(error);
    throw error;
  }
};