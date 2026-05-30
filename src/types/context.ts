import type { UserDocument } from "../models/user";

export type AppVariables = {
  requestId: string;
  user?: UserDocument;
  adminWallet?: string;
};
