// import jwt from "jsonwebtoken";
// import { v4 as uuidv4 } from "uuid";
// import Admin from "../models/admin.model";
// import RefreshToken from "../models/refreshToken.model";
// import Role from "../models/role.model";
// import config from "../config/config";

// const JWT_SECRET = config.JWT_SECRET;
// const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
// const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(config.REFRESH_TOKEN_EXPIRES_DAYS);

// class AuthService {
//   constructor() {
//     this.JWT_SECRET = JWT_SECRET;
//     this.JWT_EXPIRES_IN = JWT_EXPIRES_IN;
//     this.REFRESH_TOKEN_EXPIRES_DAYS = REFRESH_TOKEN_EXPIRES_DAYS;
//   }

//   /**
//    * Generate access token
//    */
//   generateAccessToken(admin) {
//     const playload = {
//       adminId: admin.adminId,
//       roleId: admin.roleId?._id?.toString(),
//       email: admin.email,
//       permissions: admin.permissions || [],
//     };

//     return jwt.sign(payload, this.JWT_SECRET, {
//       expiresIn: this.JWT_EXPIRES_IN,
//       issuer: "urban",
//       audience: "admin-api",
//       subject: admin.adminId,
//     });
//   }

//    /**
//    * Generate refresh token
//    */
//   generateRefreshToken() {
//     return uuidv4();
//   }

//   /**
//    * Get refresh token expiry date
//    */
//   getRefreshTokenExpiry() {
//     const expiry = new Date();
//     expiry.setDate(expiry.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS);
//     return expiry;
//   }

// }
