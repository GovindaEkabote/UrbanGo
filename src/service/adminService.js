const Admin = require("../models/admin.model");
const ReferenceToken = require("../models/refreshToken.model");
const jwt = require("jsonwebtoken");
const responseMessage = require("../constant/responseMessage");

class AdminService {
  async createAdmin(payload, createdBy) {
    return Admin.create({ ...payload, createdBy });
  }
}


module.exports =new AdminService();