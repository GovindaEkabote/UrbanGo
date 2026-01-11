const AdminService = require("../service/adminService");
const httpError = require("../utils/httpError");
const { httpResponse } = require("../utils/httpResponse");
const responseMessage = require("../constant/responseMessage");

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
}

module.exports = new adminController();
