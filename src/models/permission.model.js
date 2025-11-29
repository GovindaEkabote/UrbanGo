// models/Permission.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const PermissionSchema = new mongoose.Schema(
  {
    permissionId: {
      type: String,
      default: () => `perm_${uuidv4()}`,
      unique: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z_]+:[A-Z_]+$/, "Permission key must be MODULE:ACTION"],
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    module: {
      type: String,
      required: true,
      enum: [
        "USERS",
        "DRIVERS",
        "RIDES",
        "PRICING",
        "FINANCE",
        "SUPPORT",
        "SYSTEM",
        "ANALYTICS",
        "PERMISSIONS",
        "ROLES",
        "ADMINS",
      ],
    },
    category: {
      type: String,
      enum: ["READ", "WRITE", "DELETE", "MANAGE"],
      default: "MANAGE",
    },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PermissionSchema.index({ key: 1 }, { unique: true });
PermissionSchema.index({ module: 1, category: 1 });
PermissionSchema.index({ isActive: 1 });

export default mongoose.model("Permission", PermissionSchema);
