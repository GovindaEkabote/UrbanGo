const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authAdmin = require("../middleware/authAdmin");
const checkPermission = require("../middleware/permissions");

// Admin management
router.post(
  "/",
  authAdmin,
  checkPermission("ADMINS:CREATE"),
  adminController.createAdmin
);


router.post('/login', adminController.login)


module.exports = router