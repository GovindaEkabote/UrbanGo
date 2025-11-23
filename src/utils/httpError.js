const { createHttpError } = require('../types/types')
const responseMessage = require('../constant/responseMessage')
const config = require('../config/config')
const { EApplicationEnvironment } = require('../constant/application')

const httpError = (req, res, err, errorStatusCode = null) => {
    try {
        // Validate required parameters
        if (!req || !res) {
            throw new Error('Request and response objects are required')
        }

        if (!err) {
            throw new Error('Error object is required')
        }

        // Extract error information with better handling
        const message = err.message || responseMessage.SOMETHING_WENT_WRONG
        const trace = err.stack || null
        
        // Determine status code with priority: parameter > error.status > error.statusCode > default 500
        const statusCode = errorStatusCode || err.status || err.statusCode || 500

        // Create the error response
        const response = createHttpError({
            statusCode,
            message,
            data: err.data || null, // Allow passing additional error data
            trace,
            req
        })

        // Production environment sanitization
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            delete response.request.ip
            delete response.trace // This was missing in your original code
        }

        // Log the error (uncomment when logger is available)
        /*
        logger.error('CONTROLLER_ERROR', {
            statusCode: response.statusCode,
            message: response.message,
            url: response.request.url,
            method: response.request.method,
            ip: config.ENV === EApplicationEnvironment.DEVELOPMENT ? response.request.ip : 'REDACTED',
            trace: config.ENV === EApplicationEnvironment.DEVELOPMENT ? response.trace : 'REDACTED'
        })
        */

        // Send the error response
        return res.status(statusCode).json(response)

    } catch (handlerError) {
        // Fallback for error handler failures
        console.error('Error in httpError handler:', handlerError)
        
        const fallbackResponse = {
            success: false,
            statusCode: 500,
            message: responseMessage.SOMETHING_WENT_WRONG,
            data: null,
            request: req ? {
                ip: config.ENV === EApplicationEnvironment.PRODUCTION ? null : (req.ip ?? null),
                method: req.method,
                url: req.originalUrl
            } : null
        }

        // Additional sanitization for fallback
        if (config.ENV === EApplicationEnvironment.PRODUCTION) {
            if (fallbackResponse.request) {
                delete fallbackResponse.request.ip
            }
        }

        return res.status(500).json(fallbackResponse)
    }
}

module.exports = httpError