const config = require('../config/config')
const { createHttpError } = require('../types/types')
const { logger } = require('../utils/logger') // Fixed path: util not utils
const { EApplicationEnvironment } = require('../constant/application')

// Common error types mapping
const errorTypes = {
    ValidationError: 400,
    CastError: 400,
    JsonWebTokenError: 401,
    TokenExpiredError: 401,
    UnauthorizedError: 401,
    ForbiddenError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    default: 500
}

const getStatusCodeFromError = (error) => {
    return errorTypes[error.name] || error.statusCode || error.status || errorTypes.default
}

const getErrorMessage = (error) => {
    const messages = {
        ValidationError: 'Validation failed',
        CastError: 'Invalid ID format',
        JsonWebTokenError: 'Invalid token',
        TokenExpiredError: 'Token expired',
        UnauthorizedError: 'Unauthorized access',
        ForbiddenError: 'Access forbidden',
        NotFoundError: 'Resource not found',
        ConflictError: 'Resource already exists',
        default: 'Something went wrong'
    }
    
    return messages[error.name] || error.message || messages.default
}

const globalErrorHandler = (err, req, res, next) => {
    try {
        // Get appropriate status code and message
        const statusCode = getStatusCodeFromError(err)
        const message = getErrorMessage(err)
        const trace = err.stack || null
        
        // Ensure status code is valid
        const validStatusCode = parseInt(statusCode)
        const finalStatusCode = isNaN(validStatusCode) || validStatusCode < 100 || validStatusCode > 599 
            ? 500 
            : validStatusCode

        // Determine if we should include trace
        const includeTrace = config.ENV === EApplicationEnvironment.DEVELOPMENT
        const responseTrace = includeTrace ? trace : null

        // Handle Mongoose validation errors
        let errorData = err.data || null
        if (err.name === 'ValidationError' && err.errors) {
            errorData = Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message,
                value: error.value
            }))
        }

        // Create the error response
        const response = createHttpError({
            statusCode: finalStatusCode,
            message,
            data: errorData,
            trace: responseTrace,
            req
        })

        // Production environment sanitization
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete response.request.ip
            delete response.trace
        }

        // Enhanced logging with database storage
        const logData = {
            statusCode: finalStatusCode,
            message: err.message || message,
            originalError: err.name,
            url: req.originalUrl,
            method: req.method,
            ip: config.ENV === EApplicationEnvironment.DEVELOPMENT ? req.ip : 'REDACTED',
            userId: req.user?.id || 'anonymous',
            userAgent: req.get('User-Agent'),
            // Include request body for debugging (be careful with sensitive data)
            requestBody: config.ENV === EApplicationEnvironment.DEVELOPMENT ? 
                (req.body && Object.keys(req.body).length > 0 ? req.body : undefined) : 
                undefined,
            // Include query parameters
            queryParams: req.query && Object.keys(req.query).length > 0 ? req.query : undefined
        }

        // Add stack trace for development
        if (includeTrace) {
            logData.stack = trace
        }

        // Add additional error context
        if (err.code) {
            logData.errorCode = err.code
        }
        if (err.keyValue) {
            logData.duplicateKey = err.keyValue
        }

        // Log based on error type
        if (finalStatusCode >= 500) {
            // Server errors - log as error level
            logger.error(`SERVER_ERROR_${finalStatusCode}`, logData)
        } else if (finalStatusCode >= 400) {
            // Client errors - log as warn level
            logger.warn(`CLIENT_ERROR_${finalStatusCode}`, logData)
        } else {
            // Other errors - log as info level
            logger.info(`APPLICATION_ERROR_${finalStatusCode}`, logData)
        }

        // Send the error response
        return res.status(finalStatusCode).json(response)

    } catch (handlerError) {
        // Critical fallback with proper logging
        console.error('CRITICAL: Error handler failed:', handlerError)
        
        // Try to log the critical error
        try {
            logger.error('CRITICAL_ERROR_HANDLER_FAILURE', {
                originalError: handlerError.message,
                originalUrl: req.originalUrl,
                method: req.method,
                ip: req.ip,
                stack: handlerError.stack
            })
        } catch (logError) {
            // Ultimate fallback if even logging fails
            console.error('ULTIMATE_FALLBACK: Could not log critical error:', logError)
        }

        const fallbackResponse = {
            success: false,
            statusCode: 500,
            message: 'Internal Server Error',
            data: null,
            request: {
                ip: config.ENV === EApplicationEnvironment.PRODUCTION ? null : (req.ip ?? null),
                method: req.method,
                url: req.originalUrl
            }
        }

        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete fallbackResponse.request.ip
        }

        return res.status(500).json(fallbackResponse)
    }
}

module.exports = globalErrorHandler