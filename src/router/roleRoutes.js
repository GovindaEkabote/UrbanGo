const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const authAdmin = require("../middleware/authAdmin");
const checkPermission = require("../middleware/permissions");
const {validateRequest} = require("../middleware/validateRequest");

const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
} =require( "../validators/roleValidator.js");

router.post(
  "/create-role",
  validateRequest(createRoleSchema),
  roleController.create
);

module.exports = router;
