const healthService = require('../utils/quicker')
const { httpResponse, httpError } = require('../utils/httpResponse')

exports.getHealth = async (req, res) => {
    try {
        const health = await healthService.getOverallHealth()
        
        // Determine HTTP status code based on health status
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'unhealthy' ? 503 : 500

        return httpResponse(req, res, statusCode, `Application is ${health.status}`, health)
    } catch (error) {
        return httpError(req, res, error)
    }
}

exports.getHealthDetailed = async (req, res) => {
    try {
        const [system, application, database] = await Promise.all([
            healthService.getSystemHealth(),
            healthService.getApplicationHealth(),
            healthService.getDatabaseHealth()
        ])

        const detailedHealth = {
            status: 'detailed',
            timestamp: new Date().toISOString(),
            system,
            application,
            database
        }

        return httpResponse(req, res, 200, 'Detailed health information', detailedHealth)
    } catch (error) {
        return httpError(req, res, error)
    }
}

exports.getHealthLiveness = async (req, res) => {
    try {
        // Simple liveness probe - just check if application is running
        const liveness = {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }

        return httpResponse(req, res, 200, 'Application is alive', liveness)
    } catch (error) {
        return httpError(req, res, error)
    }
}

exports.getHealthReadiness = async (req, res) => {
    try {
        // Readiness probe - check if application is ready to receive traffic
        const database = await healthService.getDatabaseHealth()
        
        const isReady = database.status === 'connected'
        const readiness = {
            status: isReady ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            checks: {
                database: database.status === 'connected'
            },
            database
        }

        const statusCode = isReady ? 200 : 503
        return httpResponse(req, res, statusCode, `Application is ${readiness.status}`, readiness)
    } catch (error) {
        return httpError(req, res, error)
    }
}