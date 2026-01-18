const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const config = require("../config/config");

const authAdmin = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie OR header
    let token = null;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.header("Authorization")?.startsWith("Bearer ")) {
      token = req.header("Authorization").replace("Bearer ", "").trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 3️⃣ Find admin
    const admin = await Admin.findOne({
      _id: decoded.adminId, // ✅ FIXED
      isDeleted: false,
    })
      .select("-password")
      .populate({
        path: "roleId",
        populate: { path: "permissions", select: "key" },
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    // 4️⃣ Attach admin
    req.admin = admin;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
};

module.exports = authAdmin;
