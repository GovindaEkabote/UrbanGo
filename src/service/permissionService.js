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

  async createBulkPermission(permissions, adminId = null) {
    const docs = permissions.map((p) => ({
      ...p,
      key: p.key.toUpperCase(),
      module: p.module.toUpperCase(),
      category: p.category.toUpperCase(),
      isSystemPermission: p.isSystemPermission ?? true,
      createdBy: adminId,
    }));

    // Get existing permission keys
    const existing = await Permission.find({
      key: { $in: docs.map((d) => d.key) },
    }).select("key");

    const existingKeys = new Set(existing.map((p) => p.key));

    const newPermissions = docs.filter((p) => !existingKeys.has(p.key));

    if (newPermissions.length === 0) {
      return {
        inserted: 0,
        skipped: permissions.length,
      };
    }
    const inserted = await Permission.insertMany(newPermissions, {
      ordered: false,
    });

    return {
      inserted: inserted.length,
      skipped: permissions.length - inserted.length,
    };
  }
}

module.exports = PermissionService;
