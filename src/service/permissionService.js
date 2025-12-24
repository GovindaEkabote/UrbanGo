const Permission = require("../models/permission.model");

class PermissionService {
  async createPermission(data, adminId) {
    const exist = await Permission.findOne({ key: data.key, isDeleted: false });
    if (exist) {
      throw new Error("Permission key already exists");
    }

    return Permission.create({
      ...data,
      createdBy: adminId,
      updatedBy: adminId,
    });
  }
  
}


module.exports = PermissionService;