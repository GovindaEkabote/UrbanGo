const roleService = require("../service/roleService");

class RoleController {
  async create(req, res) {
    try {
      const adminId = req.admin?._id || "65d4a1b2c8e9f01234567899"; // Replace with real ID
      const role = await roleService.createRole(req.body, adminId);

      res.status(201).json({
        success: true,
        message: "Role Created Successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message,
        data: null,
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  async getAll(req, res) {
    try {
      const roles = await roleService.getRoles(req.query);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRoleById(req, res) {
    try {
      const role = await roleService.getById(req.params.id);
      res.json({ success: true, data: role });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new RoleController();
