import { createHash } from "crypto";

export const hashValue = (value: string) =>
  createHash("sha256").update(value).digest("hex");
