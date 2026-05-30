import type { UserDocument } from "../models/user";

declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
    user?: UserDocument;
    adminWallet?: string;
    validatedBody?: unknown;
  }
}
