import { AdminActionLogModel } from "../models/adminActionLog";

export const logAdminAction = async (input: {
  adminWallet: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) => {
  await AdminActionLogModel.create(input);
};
