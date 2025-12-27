const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const bootstrapGuard = require("../middleware/bootstrapMiddleware");

router.post("/", bootstrapGuard, permissionController.createPermission);
router.post("/bulk", bootstrapGuard, permissionController.createBulkPermission);
router.get("/get", bootstrapGuard, permissionController.getAllPermissions);
router.get("/get/:id", bootstrapGuard, permissionController.getById);
router.put("/update/:id", bootstrapGuard, permissionController.getByIdForUpdate);


module.exports = router;
