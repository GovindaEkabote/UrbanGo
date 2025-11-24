const express = require('express')
const router = express.Router()
const healthController = require('../controllers/healthController')

// Basic health check
router.get('/', healthController.getHealth)
// GET http://localhost:3000/api/v1/health


// Detailed health information
router.get('/detailed', healthController.getHealthDetailed)

// Kubernetes liveness probe
router.get('/liveness', healthController.getHealthLiveness)
// GET http://localhost:3000/api/v1/health/liveness


// Kubernetes readiness probe
router.get('/readiness', healthController.getHealthReadiness)
// GET http://localhost:3000/api/v1/health/readiness

// System metrics only
// http://localhost:3000/api/v1/health/system
router.get('/system', (req, res) => {
    const healthService =  require('../utils/quicker')
    const systemHealth = healthService.getSystemHealth()
    res.json({
        status: 'success',
        data: systemHealth,
        timestamp: new Date().toISOString()
    })
})

// Application metrics only
// http://localhost:3000/api/v1/health/application
router.get('/application', (req, res) => {
    const healthService = require('../utils/quicker')
    const appHealth = healthService.getApplicationHealth()
    res.json({
        status: 'success',
        data: appHealth,
        timestamp: new Date().toISOString()
    })
})

module.exports = router