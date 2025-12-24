const Joi = require("joi");

exports.createRoleSchema = Joi.object({
  roleName: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z0-9_]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Role name can only contain letters, numbers, and underscores",
      "any.required": "Role name is required",
    }),

  displayName: Joi.string().min(3).max(100).required(),

  description: Joi.string().max(500).allow("").optional(),

  permissions: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one permission is required",
      "string.pattern.base": "Invalid permission ID format",
    }),

  level: Joi.number().integer().min(1).max(10).default(1),

  metadata: Joi.object().optional(),
});

exports.updateRoleSchema = Joi.object({
  roleName: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z0-9_]+$/)
    .optional(),

  displayName: Joi.string().min(3).max(100).optional(),

  description: Joi.string().max(500).allow("").optional(),

  permissions: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .optional(),

  level: Joi.number().integer().min(1).max(10).optional(),
  isActive: Joi.boolean().optional(),
  metadata: Joi.object().optional(),
}).min(1); // At least one field to update

exports.assignPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required(),
});
