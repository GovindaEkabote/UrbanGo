const mongoose = require('mongoose')
const config = require('../config/config')
const { logger } = require('../utils/logger')

const connectDB = async () => {
    try {
        await mongoose.connect(config.DATABASE_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10, // Maximum number of sockets in the connection pool
            minPoolSize: 5,  // Minimum number of sockets in the connection pool
            retryWrites: true,
            retryReads: true
        })

        logger.info('DATABASE_CONNECTED', {
            url: config.DATABASE_URL,
            status: 'connected'
        })

        // Event listeners for database connection
        mongoose.connection.on('error', (err) => {
            logger.error('DATABASE_CONNECTION_ERROR', { 
                error: err.message,
                stack: config.ENV === 'development' ? err.stack : undefined
            })
        })

        mongoose.connection.on('disconnected', () => {
            logger.warn('DATABASE_DISCONNECTED')
        })

        mongoose.connection.on('reconnected', () => {
            logger.info('DATABASE_RECONNECTED')
        })

        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close()
                logger.info('DATABASE_CONNECTION_CLOSED', { reason: 'SIGINT' })
                process.exit(0)
            } catch (error) {
                logger.error('DATABASE_CLOSE_ERROR', { error: error.message })
                process.exit(1)
            }
        })

    } catch (error) {
        logger.error('DATABASE_CONNECTION_FAILED', {
            error: error.message,
            url: config.DATABASE_URL,
            stack: config.ENV === 'development' ? error.stack : undefined
        })
        process.exit(1)
    }
}

module.exports = { connectDB }