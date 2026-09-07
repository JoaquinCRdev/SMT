import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const info = await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: "bustamanteraul039@gmail.com", // send to yourself
  subject: "Test",
  text: "If you see this, credentials work",
});

console.log("Message sent:", info.messageId);
