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


// router.use(authAdmin);

router.post(
  "/",
  // checkPermission("ROLE_CREATE"),
  validateRequest(createRoleSchema),
  roleController.create
);

router.get(
  "/",
  // checkPermission("ROLE_READ"),
  roleController.getAll
)

router.get(
  "/:id",
  // checkPermission("ROLE_READ"),
  roleController.getRoleById
);

router.put(
  "/:id",
  // checkPermission("ROLE_UPDATE"),
 validateRequest(updateRoleSchema),
  roleController.updateRoleById
);

router.delete(
  "/:id",
  // checkPermission("ROLE_DELETE"),
  roleController.deleteRoleById
);

module.exports = router;
