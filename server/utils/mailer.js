import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendSignupOtpEmail = async ({ to, otp, name }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Your AVG signup OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Hi ${name || "User"},</h2>
        <p>Your OTP for signup is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 12px 16px; background: #f2f2f2; display: inline-block; border-radius: 8px;">
          ${otp}
        </div>
        <p style="margin-top: 16px;">This OTP expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendForgotPasswordOtpEmail = async ({ to, name, otp, userCode }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset OTP</h2>
        <p>Hello ${name || "User"},</p>
        <p>You requested to reset the password for account <b>${userCode}</b>.</p>
        <p>Your OTP is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This OTP will expire soon. If you did not request this, ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};