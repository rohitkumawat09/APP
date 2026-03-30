import crypto from "crypto";

export const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  return {
    otp,
    otpHash,
  };
};

export const getOtpExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
