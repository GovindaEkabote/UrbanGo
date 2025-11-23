const { EApplicationEnvironment } = require('../constant/application')
const config = require('../config/config')

const logger = {
    error: (message, meta = {}) => {
        const timestamp = new Date().toISOString()
        if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
            console.error(`[ERROR] ${timestamp}:`, message, meta)
        } else {
            console.error(`[ERROR] ${timestamp}:`, message)
            // In production, you might want to send to a logging service
        }
    },
    
    warn: (message, meta = {}) => {
        const timestamp = new Date().toISOString()
        if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
            console.warn(`[WARN] ${timestamp}:`, message, meta)
        } else {
            console.warn(`[WARN] ${timestamp}:`, message)
        }
    },
    
    info: (message, meta = {}) => {
        const timestamp = new Date().toISOString()
        if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
            console.log(`[INFO] ${timestamp}:`, message, meta)
        } else {
            console.log(`[INFO] ${timestamp}:`, message)
        }
    },
    
    debug: (message, meta = {}) => {
        const timestamp = new Date().toISOString()
        if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
            console.log(`[DEBUG] ${timestamp}:`, message, meta)
        }
        // No logging in production for debug level
    }
}

module.exports = { logger }