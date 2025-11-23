const express = require('express')
const router = express.Router();
const apiController = require('../controllers/apiController')

router.route('/seft').get(apiController.self)
router.route('/seft/:id').get(apiController.getUserById)

module.exports =  router;


