const config = require('../config/config')
const os = require('os')
const mongoose = require('mongoose')
const { logger } = require('../utils/logger')
const { EApplicationEnvironment } = require('../constant/application')

class HealthService {
    constructor() {
        this.startTime = Date.now()
    }

    getSystemHealth() {
        try {
            const cpus = os.cpus()
            const totalMem = os.totalmem()
            const freeMem = os.freemem()
            const usedMem = totalMem - freeMem

            return {
                cpu: {
                    cores: cpus.length,
                    model: cpus[0]?.model || 'Unknown',
                    speed: `${cpus[0]?.speed || 0} MHz`,
                    loadAverage: os.loadavg(),
                    usage: `${((1 - freeMem / totalMem) * 100).toFixed(2)}%`
                },
                memory: {
                    total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    usage: `${((usedMem / totalMem) * 100).toFixed(2)}%`
                },
                os: {
                    platform: os.platform(),
                    arch: os.arch(),
                    release: os.release(),
                    uptime: `${(os.uptime() / 3600).toFixed(2)} hours`
                }
            }
        } catch (error) {
            logger.error('HEALTH_SYSTEM_METRICS_ERROR', { error: error.message })
            return { error: 'Failed to get system metrics' }
        }
    }

    getApplicationHealth() {
        try {
            const memoryUsage = process.memoryUsage()
            const uptime = process.uptime()

            return {
                environment: config.ENV,
                nodeVersion: process.version,
                pid: process.pid,
                uptime: {
                    seconds: Math.floor(uptime),
                    formatted: this.formatUptime(uptime)
                },
                memory: {
                    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
                    arrayBuffers: `${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
                },
                application: {
                    startTime: new Date(this.startTime).toISOString(),
                    runningFor: this.formatUptime((Date.now() - this.startTime) / 1000)
                }
            }
        } catch (error) {
            logger.error('HEALTH_APPLICATION_METRICS_ERROR', { error: error.message })
            return { error: 'Failed to get application metrics' }
        }
    }

    async getDatabaseHealth() {
        try {
            if (!mongoose.connection.readyState) {
                return {
                    status: 'disconnected',
                    message: 'Database is not connected'
                }
            }

            // Test database connection with a simple query
            const startTime = Date.now()
            await mongoose.connection.db.admin().ping()
            const responseTime = Date.now() - startTime

            return {
                status: 'connected',
                database: mongoose.connection.name,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                readyState: this.getReadyState(mongoose.connection.readyState),
                responseTime: `${responseTime}ms`,
                collections: await mongoose.connection.db.listCollections().toArray().then(collections => 
                    collections.map(col => col.name)
                )
            }
        } catch (error) {
            logger.error('HEALTH_DATABASE_CHECK_ERROR', { error: error.message })
            return {
                status: 'error',
                message: error.message,
                readyState: this.getReadyState(mongoose.connection.readyState)
            }
        }
    }

    async getOverallHealth() {
        try {
            const [system, application, database] = await Promise.all([
                this.getSystemHealth(),
                this.getApplicationHealth(),
                this.getDatabaseHealth()
            ])

            // Determine overall status
            const isHealthy = database.status === 'connected' && 
                            !system.error && 
                            !application.error

            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                system,
                application,
                database,
                checks: {
                    database: database.status === 'connected',
                    system: !system.error,
                    application: !application.error
                }
            }
        } catch (error) {
            logger.error('HEALTH_OVERALL_CHECK_ERROR', { error: error.message })
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                message: 'Health check failed',
                error: error.message
            }
        }
    }

    getReadyState(state) {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        }
        return states[state] || 'unknown'
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (3600 * 24))
        const hours = Math.floor((seconds % (3600 * 24)) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        const parts = []
        if (days > 0) parts.push(`${days}d`)
        if (hours > 0) parts.push(`${hours}h`)
        if (minutes > 0) parts.push(`${minutes}m`)
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

        return parts.join(' ')
    }
}

module.exports = new HealthService()