const Role = require("../models/role.model");
const Permission = require("../models/permission.model");

class RoleService {
  async createRole(data, createdBy) {
    const {
      roleName,
      displayName,
      description = "",
      permissions = [],
      level = 1,
      metadata = {},
    } = data;

    // Fix validation logic
    if (!roleName || !displayName) {
      throw new Error("roleName and displayName are required");
    }

    // Check if permissions array is provided (even if empty)
    if (!Array.isArray(permissions)) {
      throw new Error("permissions must be an array");
    }

    // Validate permissions exist (only if permissions array is not empty)
    if (permissions.length > 0) {
      const permissionDocs = await Permission.find({
        _id: { $in: permissions },
        isActive: true,
        isDeleted: false,
      });

      if (permissionDocs.length !== permissions.length) {
        const foundIds = permissionDocs.map((p) => p._id.toString());
        const invalidIds = permissions.filter(
          (id) => !foundIds.includes(id.toString())
        );
        throw new Error(
          `Invalid permissions provided: ${invalidIds.join(", ")}`
        );
      }
    } else {
      // If no permissions provided, you might want to allow it or not
      // For now, let's require at least one permission
      throw new Error("At least one permission is required");
    }

    // Validate level
    if (level < 1 || level > 10) {
      throw new Error("Level must be between 1 and 10");
    }

    // Check if roleName already exists (case-insensitive)
    const existingRole = await Role.findOne({
      roleName: { $regex: new RegExp(`^${roleName}$`, "i") },
      isDeleted: false,
    });

    if (existingRole) {
      throw new Error(`Role with name '${roleName}' already exists`);
    }

    // Create the role
    const role = await Role.create({
      roleName: roleName.toUpperCase(), // Store as uppercase
      displayName,
      description,
      permissions,
      level: parseInt(level),
      createdBy,
      updatedBy: createdBy,
      metadata,
      isSystemRole: false,
      isActive: true,
    });

    console.log("✅ Role created successfully:", role._id);

    // Populate the role with permissions and creator info
    const populatedRole = await Role.findById(role._id)
      .populate("permissions", "permissionCode name description")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    return populatedRole;
  }

  async getRoles({ page = 1, limit = 10, isActive }) {
    const filter = { isActive: false };
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    const skip = (page - 1) * limit;

    const roles = await Role.find(filter)
      .populate("permissions", "permissions name")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Role.countDocuments(filter);

    return {
      items: roles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    };
  }

  async getById(id) {
    const role = await Role.findById({
      _id: id,
      isDeleted: false,
    }).populate("permissions");

    if (!role) {
      throw new Error("Role not found");
    }
    return role;
  }
}

module.exports = new RoleService();
