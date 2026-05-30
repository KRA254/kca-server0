import argon2 from "argon2";
import { UserModel, type UserDocument } from "../models/user";

export const createGuestUser = async (pseudonym?: string, password?: string) => {
  const passwordHash = password ? await argon2.hash(password) : undefined;
  const user = await UserModel.create({
    pseudonym,
    passwordHash,
    isGuest: !passwordHash,
  });
  return user;
};

export const resolveUser = async (input: {
  userId?: string;
  pseudonym?: string;
  password?: string;
}): Promise<UserDocument> => {
  if (input.userId) {
    const existing = await UserModel.findById(input.userId);
    if (existing) {
      if (input.password && !existing.passwordHash) {
        existing.passwordHash = await argon2.hash(input.password);
        existing.isGuest = false;
        await existing.save();
      }
      return existing;
    }
  }
  return createGuestUser(input.pseudonym, input.password);
};

export const touchUserActivity = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, {
    $set: { lastActiveAt: new Date() },
  });
};
