const jwt = require("jsonwebtoken");
const config = require("../config/config");

exports.generateAccessToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      role: admin.role,
      type: "access",
    },
    config.JWT_SECRET,
    { expiresIn: `${config.JWT_EXPIRES_IN}` }
  );
};

exports.generateRefreshToken = (admin) => {
  return jwt.sign(
    {
      adminId: admin._id,
      type: "refresh",
    },
    config.ADMIN_JWT_SECRET,
     { expiresIn: `${config.REFRESH_TOKEN_EXPIRES_DAYS}d` }
  );
};
