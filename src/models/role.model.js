// models/Role.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const RoleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      default: () => `role_${uuidv4()}`,
      unique: true,
      immutable: true,
      index: true,
    },
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Role name must be at least 3 characters"],
      maxlength: [50, "Role name cannot exceed 50 characters"],
      match: [
        /^[A-Z0-9_]+$/,
        "Role name must contain only uppercase letters, numbers and underscores",
      ],
      index: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      minlength: [3, "Display name must be at least 3 characters"],
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // store permissions as ObjectId refs; keep a validator to prevent duplicates and empty arrays
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    isSystemRole: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    level: { type: Number, default: 1, min: 1, max: 10, index: true },

    // audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
RoleSchema.virtual("permissionCount").get(function () {
  return Array.isArray(this.permissions) ? this.permissions.length : 0;
});
RoleSchema.virtual("displayRoleName").get(function () {
  return this.displayName || this.roleName;
});

// Validate permissions array at save time (non-empty and unique)
RoleSchema.path("permissions").validate(function (perms) {
  if (!perms || !Array.isArray(perms) || perms.length === 0) return false;
  const setSize = new Set(perms.map(String)).size;
  return setSize === perms.length;
}, "Role must have at least one unique permission");

// Protect system roles from being soft-deleted via .save()
RoleSchema.pre("save", function (next) {
  if (this.isModified("isDeleted") && this.isDeleted && this.isSystemRole) {
    return next(new Error("System roles cannot be deleted"));
  }

  // If system role, restrict modifications to allowed fields only
  if (this.isSystemRole && !this.isNew) {
    const allowed = ["description", "updatedBy", "metadata", "isActive"];
    const changed = this.modifiedPaths();
    const blocked = changed.filter((f) => !allowed.includes(f));
    if (blocked.length) {
      return next(
        new Error(`Cannot modify ${blocked.join(", ")} on system roles`)
      );
    }
  }

  next();
});

// Prevent system-role deletion/illegal modification in query-based updates
async function preventSystemRoleMutation(next) {
  const updateObj =
    this.getUpdate && (this.getUpdate().$set || this.getUpdate());
  if (!updateObj) return next();

  const isDeleting =
    updateObj.isDeleted === true ||
    (this.getUpdate().$set && this.getUpdate().$set.isDeleted === true);
  const filter = this.getQuery();
  const doc = await this.model.findOne(filter).select("isSystemRole").lean();

  if (doc && doc.isSystemRole) {
    // if delete attempt
    if (isDeleting) return next(new Error("System roles cannot be deleted"));

    // if other updates, enforce allowed fields only
    const allowed = ["description", "updatedBy", "metadata", "isActive"];
    const updateFields = Object.keys(
      this.getUpdate().$set || this.getUpdate()
    ).filter((k) => k !== "_id");
    const blocked = updateFields.filter((f) => !allowed.includes(f));
    if (blocked.length)
      return next(
        new Error(`Cannot modify ${blocked.join(", ")} on system roles`)
      );
  }

  next();
}
RoleSchema.pre("findOneAndUpdate", preventSystemRoleMutation);
RoleSchema.pre("updateOne", preventSystemRoleMutation);
RoleSchema.pre("updateMany", preventSystemRoleMutation);

// Indexes: minimal and useful
RoleSchema.index({ roleName: 1 }, { unique: true });
RoleSchema.index({ level: 1 });
RoleSchema.index({ createdAt: -1 });

export default mongoose.model("Role", RoleSchema);
