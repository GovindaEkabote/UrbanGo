const { EApplicationEnvironment } = require('../constant/application')
const config = require('../config/config')
const winston = require('winston')
require('winston-mongodb') 


// Create logs directory for file logs
const fs = require('fs')
const path = require('path')
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

// Development format
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

// Create Winston logger with MongoDB transport
const winstonLogger = winston.createLogger({
    level: config.ENV === EApplicationEnvironment.PRODUCTION ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'urbango-api' },
    transports: [
        // MongoDB transport - stores logs in database
        new winston.transports.MongoDB({
            level: 'info', // Store info and above in DB
            db: config.DATABASE_URL,
            options: {
                useUnifiedTopology: true
            },
            collection: 'application_logs',
            capped: true, // Use capped collection for performance
            cappedSize: 10000000, // 10MB capped size
            cappedMax: 10000, // Maximum 10,000 documents
            expireAfterSeconds: 2592000, // Auto-delete after 30 days (optional)
            metaKey: 'meta', // Store metadata in 'meta' field
            decolorize: true
        }),

        // File transport for errors
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),

        // File transport for all logs
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
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

// Your logger interface
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