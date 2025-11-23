const { createHttpResponse, createHttpError } = require('../types/types')
const config = require('../config/config')
const { EApplicationEnvironment } = require('../constant/application')

const httpResponse = (
    req,
    res,
    responseStatusCode,
    responseMessage,
    data = null
) => {
    try {
        // Validate inputs
        if (!req || !res) {
            throw new Error('Request and response objects are required');
        }

        const response = createHttpResponse({
            success: responseStatusCode >= 200 && responseStatusCode < 300,
            statusCode: responseStatusCode,
            message: responseMessage,
            data,
            req
        })

        // Sanitize for production
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete response.request.ip
            // Consider removing trace from errors in production too
        }

        return res.status(responseStatusCode).json(response)
    } catch (error) {
        // Use the error creation function for consistency
        const errorResponse = createHttpError({
            statusCode: 500,
            message: 'Internal Server Error',
            data: null,
            trace: config.ENV === EApplicationEnvironment.DEVELOPMENT ? error.stack : null,
            req
        })

        // Sanitize error for production
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete errorResponse.request.ip
            delete errorResponse.trace
        }

        return res.status(500).json(errorResponse)
    }
}

// New error response utility
const httpError = (req, res, err, errorStatusCode = null) => {
    try {
        // Validate required parameters
        if (!req || !res) {
            throw new Error('Request and response objects are required')
        }

        if (!err) {
            throw new Error('Error object is required')
        }

        // Extract error information
        const message = err.message || 'Something went wrong'
        const trace = err.stack || null
        
        // Ensure status code is a number with proper fallback
        let statusCode = 500
        
        if (errorStatusCode !== null && errorStatusCode !== undefined) {
            statusCode = Number(errorStatusCode)
        } else if (err.status) {
            statusCode = Number(err.status)
        } else if (err.statusCode) {
            statusCode = Number(err.statusCode)
        }
        
        // Validate status code is a valid number
        if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
            statusCode = 500
        }

        // Create the error response
        const response = createHttpError({
            statusCode: statusCode,
            message: message,
            data: err.data || null,
            trace: trace,
            req: req
        })

        // Production environment sanitization
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete response.request.ip
            delete response.trace
        }

        return res.status(statusCode).json(response)

    } catch (handlerError) {
        console.error('Error in httpError handler:', handlerError)
        
        const fallbackResponse = {
            success: false,
            statusCode: 500,
            message: 'Internal Server Error',
            data: null,
            request: req ? {
                ip: config.ENV === EApplicationEnvironment.PRODUCTION ? null : (req.ip ?? null),
                method: req.method,
                url: req.originalUrl
            } : null
        }

        if (config.ENV === EApplicationEnvironment.PRODUCTION && fallbackResponse.request) {
            delete fallbackResponse.request.ip
        }

        return res.status(500).json(fallbackResponse)
    }
}

module.exports = {
    httpResponse,
    httpError
}