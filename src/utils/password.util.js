import bcrypt from "bcryptjs";

export const hashPassword = async (pwd) => {
  return bcrypt.hash(pwd, 10);
};

export const comparePassword = async (pwd, hash) => {
  return bcrypt.compare(pwd, hash);
};
