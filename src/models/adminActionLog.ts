import { Schema, model, type InferSchemaType } from "mongoose";

const AdminActionLogSchema = new Schema(
  {
    adminWallet: { type: String, required: true, index: true },
    action: { type: String, required: true, maxlength: 120 },
    targetType: { type: String, required: true, maxlength: 80 },
    targetId: { type: String, required: false, maxlength: 80 },
    metadata: { type: Schema.Types.Mixed, required: false },
    ip: { type: String, required: false },
    userAgent: { type: String, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdminActionLogSchema.index({ adminWallet: 1, createdAt: -1 });
AdminActionLogSchema.index({ action: 1, createdAt: -1 });

export type AdminActionLogDocument = InferSchemaType<typeof AdminActionLogSchema>;
export const AdminActionLogModel = model("AdminActionLog", AdminActionLogSchema);
