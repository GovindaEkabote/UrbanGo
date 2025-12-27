const Permission = require("../models/permission.model");
const mongoose = require("mongoose");

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

  async getAllPermission({ page, limit, skip, filters = {} }) {
    const [data, total] = await Promise.all([
      Permission.find({ isDeleted: false, ...filters })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Permission.countDocuments({ isDeleted: false, ...filters }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPermissionById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid permission ID");
      err.statusCode = 400;
      throw err;
    }

    const permission = await Permission.findById(id);
    if (!permission) {
      const err = new Error("Permission not found");
      err.statusCode = 404;
      throw err;
    }

    return permission;
  }

  async updatePermission(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid permission ID");
      err.statusCode = 400;
      throw err;
    }

    const updatedPermission = await Permission.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPermission) {
      const err = new Error("Permission not found for update");
      err.statusCode = 404;
      throw err;
    }
    return updatedPermission;
  }

  async deletePermissionById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid permission ID");
      err.statusCode = 400;
      throw err;
    }

    const deleted = await Permission.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error("Permission not found For delete");
      err.statusCode = 404;
      throw err;
    }
    return deleted;
  }
}

module.exports = PermissionService;
