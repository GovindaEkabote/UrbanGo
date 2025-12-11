// models/RefreshToken.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      default: () => `rt_${uuidv4()}`,
      unique: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    token: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true },

    // device / session metadata
    ip: { type: String },
    userAgent: { type: String },
    deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRevoked: { type: Boolean, default: false, index: true },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    lastUsedAt: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  }
);

// TTL index for automatic cleanup (optional: set in DB to expire docs after long time)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", RefreshTokenSchema);
