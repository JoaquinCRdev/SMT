import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async ({ to, rawToken }) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Password Reset",
    html: `<p>Click the link below to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};
