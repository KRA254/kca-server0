import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new Schema(
  {
    pseudonym: {
      type: String,
      unique: true,
      required: true,
      default: () => `Anon-${uuidv4()}`,
      minlength: 2,
      maxlength: 64,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    isGuest: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    reputationScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalSubmissions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    optionalEmailHash: {
      type: String,
      required: false,
    },
    lastActiveAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

UserSchema.index({ pseudonym: 1 }, { unique: true });
UserSchema.index({ optionalEmailHash: 1 }, { sparse: true });
UserSchema.index({ lastActiveAt: -1 });

export type UserDocument = HydratedDocument<InferSchemaType<typeof UserSchema>>;
export const UserModel = model("User", UserSchema);
