const { EApplicationEnvironment } = require('../constant/application')
const config = require('../config/config')
const winston = require('winston')

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

// Development format - more human readable
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta, null, 2)}`
        }
        return log
    })
)

// Create Winston logger instance
const winstonLogger = winston.createLogger({
    level: config.ENV === EApplicationEnvironment.PRODUCTION ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'urbango-api' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
})

// Add console transport for non-production environments
if (config.ENV !== EApplicationEnvironment.PRODUCTION) {
    winstonLogger.add(new winston.transports.Console({
        format: devFormat
    }))
}

// Your existing logger interface (compatibility layer)
const logger = {
    error: (message, meta = {}) => {
        if (typeof message === 'object') {
            winstonLogger.error(message);
        } else {
            winstonLogger.error(message, meta);
        }
    },
    
    warn: (message, meta = {}) => {
        if (typeof message === 'object') {
            winstonLogger.warn(message);
        } else {
            winstonLogger.warn(message, meta);
        }
    },
    
    info: (message, meta = {}) => {
        if (typeof message === 'object') {
            winstonLogger.info(message);
        } else {
            winstonLogger.info(message, meta);
        }
    },
    
    debug: (message, meta = {}) => {
        if (typeof message === 'object') {
            winstonLogger.debug(message);
        } else {
            winstonLogger.debug(message, meta);
        }
    }
}

module.exports = { logger, winstonLogger }