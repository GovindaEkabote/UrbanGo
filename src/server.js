const app = require("./app");
const config = require("./config/config");
const {connectDB } = require('./service/databaseService')
const {logger} = require('./utils/logger')

const PORT = config.PORT || 3000

const startServer = async () => {
    try {
        // Log application start
        logger.info('APPLICATION_STARTING', {
            port: PORT,
            environment: config.ENV,
            serverUrl: config.SERVER_URL
        })

        // Connect to database
        await connectDB()

        // Start server
        const server = app.listen(PORT, () => {
            logger.info('APPLICATION_STARTED', {
                port: PORT,
                environment: config.ENV,
                serverUrl: config.SERVER_URL,
                status: 'running'
            })
        })

        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            logger.info('APPLICATION_SHUTDOWN_INITIATED', { signal })
            
            server.close(async (error) => {
                if (error) {
                    logger.error('APPLICATION_SHUTDOWN_ERROR', { error: error.message })
                    process.exit(1)
                }

                try {
                    // Close database connection
                    await mongoose.connection.close()
                    logger.info('APPLICATION_SHUTDOWN_COMPLETE', { signal })
                    process.exit(0)
                } catch (dbError) {
                    logger.error('DATABASE_CLOSE_ERROR_SHUTDOWN', { error: dbError.message })
                    process.exit(1)
                }
            })

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('APPLICATION_SHUTDOWN_FORCED', { reason: 'timeout' })
                process.exit(1)
            }, 10000)
        }

        // Handle different shutdown signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')) // For nodemon

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('UNCAUGHT_EXCEPTION', {
                error: error.message,
                stack: config.ENV === 'development' ? error.stack : undefined
            })
            process.exit(1)
        })

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('UNHANDLED_REJECTION', {
                reason: reason instanceof Error ? reason.message : reason,
                stack: config.ENV === 'development' ? (reason instanceof Error ? reason.stack : undefined) : undefined
            })
            process.exit(1)
        })

    } catch (error) {
        logger.error('APPLICATION_STARTUP_FAILED', {
            error: error.message,
            stack: config.ENV === 'development' ? error.stack : undefined
        })
        process.exit(1)
    }
}

// Start the application
startServer()
