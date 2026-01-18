const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

/* ----------------------------- LOGIN HISTORY ----------------------------- */
const LoginHistorySchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    success: { type: Boolean, required: true },
    failureReason: {
      type: String,
      enum: [
        "INVALID_CREDENTIALS",
        "ACCOUNT_INACTIVE",
        "ACCOUNT_SUSPENDED",
        "ACCOUNT_LOCKED",
        "OTHER",
      ],
      default: null,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ------------------------------- ADMIN ----------------------------------- */
const AdminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      default: () => `admin_${uuidv4()}`,
      immutable: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Invalid email format",
      ],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      avatar: { type: String, default: "" },
      phone: { type: String },
      timezone: { type: String, default: "UTC" },
      language: {
        type: String,
        enum: ["en", "hi", "fr", "es", "de"],
        default: "en",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"],
      default: "ACTIVE",
    },

    lastLoginAt: Date,

    loginHistory: {
      type: [LoginHistorySchema],
      default: [],
    },

    security: {
      failedLoginAttempts: { type: Number, default: 0, select: false },
      lastFailedLogin: { type: Date, select: false },
      accountLockedUntil: { type: Date, select: false },
      passwordChangedAt: { type: Date, select: false },
      passwordResetToken: { type: String, select: false },
      passwordResetExpires: { type: Date, select: false },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.password;
        delete ret.security;
        return ret;
      },
    },
  }
);

/* ------------------------------- INDEXES --------------------------------- */
AdminSchema.index({ adminId: 1 }, { unique: true });
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ roleId: 1 });
AdminSchema.index({ status: 1 });
AdminSchema.index({ isDeleted: 1 });

/* ------------------------------- VIRTUALS -------------------------------- */
AdminSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

/* ----------------------------- MIDDLEWARE -------------------------------- */
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);

  this.security.passwordChangedAt = new Date();
  next();
});

/* ------------------------------- METHODS --------------------------------- */
AdminSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

AdminSchema.methods.isAccountLocked = function () {
  return (
    this.security?.accountLockedUntil &&
    this.security.accountLockedUntil > new Date()
  );
};

AdminSchema.methods.addLoginAttempt = function (
  ip,
  userAgent,
  success,
  failureReason = null
) {
  this.loginHistory.unshift({
    ip,
    userAgent,
    success,
    failureReason: success ? null : failureReason,
  });

  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(0, 50);
  }

  if (success) {
    this.lastLoginAt = new Date();
    this.security.failedLoginAttempts = 0;
    this.security.accountLockedUntil = null;
    this.status = "ACTIVE";
  } else {
    this.security.failedLoginAttempts += 1;
    this.security.lastFailedLogin = new Date();

    if (this.security.failedLoginAttempts >= 5) {
      this.security.accountLockedUntil = new Date(
        Date.now() + 30 * 60 * 1000
      );
      this.status = "LOCKED";
    }
  }
};

AdminSchema.methods.generatePasswordResetToken = function () {
  const token = uuidv4();
  this.security.passwordResetToken = token;
  this.security.passwordResetExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );
  return token;
};

/* ------------------------------- EXPORT ---------------------------------- */
module.exports = mongoose.model("Admin", AdminSchema);
