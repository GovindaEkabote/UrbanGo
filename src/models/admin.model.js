// models/Admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const LoginHistorySchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    success: { type: Boolean, required: true, index: true },
    failureReason: {
      type: String,
      enum: [
        "INVALID_CREDENTIALS",
        "ACCOUNT_INACTIVE",
        "ACCOUNT_SUSPENDED",
        "OTHER",
      ],
      default: null,
    },
  },
  { _id: false }
);

const AdminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      default: () => `admin_${uuidv4()}`,
      unique: true,
      immutable: true,
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email address",
      ],
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    profile: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      avatar: { type: String, default: "" },
      phone: {
        type: String,
        trim: true,
        match: [
          /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
          "Please enter a valid phone number",
        ],
      },
      timezone: { type: String, default: "UTC" },
      language: {
        type: String,
        default: "en",
        enum: ["en", "es", "fr", "de", "hi"],
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"],
      default: "ACTIVE",
      index: true,
    },

    lastLoginAt: { type: Date, index: true },
    loginHistory: { type: [LoginHistorySchema], default: [] }, // keep small (we trim)

    // security (kept minimal in doc; tokens stored in RefreshToken collection)
    security: {
      failedLoginAttempts: { type: Number, default: 0, select: false },
      lastFailedLogin: { type: Date, select: false },
      accountLockedUntil: { type: Date, select: false },
      passwordChangedAt: { type: Date, select: false },
      passwordResetToken: { type: String, select: false },
      passwordResetExpires: { type: Date, select: false },
    },

    // audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // remove sensitive internal fields
        delete ret.password;
        delete ret.metadata;
        if (ret.security) {
          delete ret.security;
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtuals
AdminSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});
AdminSchema.virtual("initials").get(function () {
  return `${this.profile.firstName?.[0] || ""}${
    this.profile.lastName?.[0] || ""
  }`.toUpperCase();
});

// Hash passwords before save
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);

    // set passwordChangedAt
    this.security = this.security || {};
    this.security.passwordChangedAt = new Date();

    next();
  } catch (err) {
    next(err);
  }
});

// Method: verify password
AdminSchema.methods.verifyPassword = async function (plain) {
  // password field is select:false by default, so ensure it's selected when calling this
  return bcrypt.compare(plain, this.password);
};

// Method: add login attempt
AdminSchema.methods.addLoginAttempt = function (
  ip,
  userAgent,
  success,
  failureReason = null
) {
  this.loginHistory = this.loginHistory || [];
  this.loginHistory.unshift({
    ip,
    userAgent,
    timestamp: new Date(),
    success,
    failureReason: success ? null : failureReason,
  });

  // trim to last 50
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(0, 50);
  }

  if (success) {
    this.lastLoginAt = new Date();
    this.security.failedLoginAttempts = 0;
    this.security.accountLockedUntil = null;
  } else {
    this.security.failedLoginAttempts =
      (this.security.failedLoginAttempts || 0) + 1;
    this.security.lastFailedLogin = new Date();

    // lock after 5 failed attempts
    if (this.security.failedLoginAttempts >= 5) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      this.security.accountLockedUntil = new Date(Date.now() + lockDuration);
      this.status = "LOCKED";
    }
  }
};

// Method: is account locked
AdminSchema.methods.isAccountLocked = function () {
  return this.security?.accountLockedUntil
    ? this.security.accountLockedUntil > new Date()
    : false;
};

// Method: generate password reset token
AdminSchema.methods.generatePasswordResetToken = function () {
  const token = uuidv4();
  this.security.passwordResetToken = token;
  this.security.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return token;
};

// Security measure: invalidate refresh tokens issued before password change
// When checking refresh tokens, services should compare token.createdAt > admin.security.passwordChangedAt

// Indexes (kept to essentials)
AdminSchema.index({ adminId: 1 }, { unique: true });
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ roleId: 1 });
AdminSchema.index({ status: 1 });
AdminSchema.index({ isDeleted: 1 });

// Export
export default mongoose.model("Admin", AdminSchema);
