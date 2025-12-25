const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const bootstrapGuard = require("../middleware/bootstrapMiddleware");

router.post("/", bootstrapGuard, permissionController.createPermission);
router.post("/bulk", bootstrapGuard, permissionController.createBulkPermission);

module.exports = router;
