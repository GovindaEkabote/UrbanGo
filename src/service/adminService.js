const Admin = require("../models/admin.model");
const ReferenceToken = require("../models/refreshToken.model");
const jwt = require("jsonwebtoken");
const responseMessage = require("../constant/responseMessage");
const config = require("../config/config");

class AdminService {
  async createAdmin(payload, createdBy) {
    return Admin.create({ ...payload, createdBy });
  }

  async login({ email, password, ip, userAgent }) {
    const admin = await Admin.findOne({ email, isDeleted: false })
      .select("+password +security")
      .populate({
        path: "roleId",
        populate: { path: "permissions", select: "key" },
      });

    if (!admin) {
      throw { message: responseMessage.INVALID_CREDENTIALS, statusCode: 401 };
    }

    if (admin.status !== "ACTIVE") {
      throw {
        message: `Account is ${admin.status.toLowerCase()}`,
        statusCode: 403,
      };
    }

    if (admin.isAccountLocked()) {
      throw { message: responseMessage.ACCOUNT_LOCKED, statusCode: 423 };
    }

    const isMatch = await admin.verifyPassword(password);

    admin.addLoginAttempt(ip, userAgent, isMatch, "INVALID_CREDENTIALS");
    await admin.save();

    if (!isMatch) {
      throw { message: responseMessage.INVALID_CREDENTIALS, statusCode: 401 };
    }

    // 🔐 ACCESS TOKEN
    const accessToken = jwt.sign(
      { adminId: admin._id, roleId: admin.roleId._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // 🔁 REFRESH TOKEN
    const refreshToken = jwt.sign(
      { adminId: admin._id },
      config.ADMIN_JWT_SECRET,
      { expiresIn: `${config.REFRESH_TOKEN_EXPIRES_DAYS}d` }
    );

    // 📅 Absolute expiry
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Number(config.REFRESH_TOKEN_EXPIRES_DAYS)
    );

    // 💾 Save refresh token
    await ReferenceToken.create({
      adminId: admin._id,
      token: refreshToken,
      expiresAt,
      ip,
      userAgent,
    });

    return { admin, accessToken, refreshToken };
  }
}
module.exports = new AdminService();
