const AdminService = require("../service/adminService");
const httpError = require("../utils/httpError");
const { httpResponse } = require("../utils/httpResponse");
const responseMessage = require("../constant/responseMessage");
const config = require("../config/config");

class adminController {
  async createAdmin(req, res) {
    try {
      const admin = await AdminService.createAdmin(
        req.body,
        req.admin?._id || null
      );

      return httpResponse(req, res, 201, responseMessage.ADMIN_CREATED, admin);
    } catch (error) {
      return httpError(req, res, error);
    }
  }
  async login(req, res) {
  try {
    const { admin, accessToken, refreshToken } =
      await AdminService.login({
        email: req.body.email,
        password: req.body.password,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

    // 🍪 ACCESS TOKEN (short-lived)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // 🍪 REFRESH TOKEN (long-lived)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Number(config.REFRESH_TOKEN_EXPIRES_DAYS) * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin,
      },
    });
  } catch (error) {
    return httpError(req, res, error);
  }
}

}

module.exports = new adminController();
