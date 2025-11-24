const config = require('../config/config')
const { createHttpError } = require('../types/types')
const { logger } = require('../utils/logger')
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

        // Enhanced logging with Winston
        const logData = {
            statusCode: finalStatusCode,
            message: err.message || message,
            originalError: err.name,
            url: req.originalUrl,
            method: req.method,
            ip: config.ENV === EApplicationEnvironment.DEVELOPMENT ? req.ip : 'REDACTED',
            userId: req.user?.id || 'anonymous',
            userAgent: req.get('User-Agent')
        }

        // Add stack trace for development
        if (includeTrace) {
            logData.stack = trace
        }

        // Log based on error type
        if (finalStatusCode >= 500) {
            // Server errors
            logger.error('SERVER_ERROR', logData)
        } else {
            // Client errors
            logger.warn('CLIENT_ERROR', logData)
        }

        // Send the error response
        return res.status(finalStatusCode).json(response)

    } catch (handlerError) {
        // Critical fallback with proper logging
        logger.error('CRITICAL_ERROR_HANDLER_FAILURE', {
            originalError: handlerError.message,
            originalUrl: req.originalUrl,
            stack: handlerError.stack
        })

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