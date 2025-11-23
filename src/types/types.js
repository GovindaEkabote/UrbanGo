    function createHttpResponse({ success, statusCode, message, data, req }) {
    if (!req) {
        throw new Error('Request object is required');
    }
    
    return {
        success: Boolean(success),
        statusCode: Number(statusCode),
        message: String(message),
        data: data !== undefined ? data : null,
        request: {
            ip: req.ip ?? null,
            method: req.method,
            url: req.originalUrl
        }
    }
}

function createHttpError({ statusCode, message, data, trace = null, req }) {
    if (!req) {
        throw new Error('Request object is required');
    }
    
    return {
        success: false,
        statusCode: Number(statusCode),
        message: String(message),
        data: data !== undefined ? data : null,
        trace,
        request: {
            ip: req.ip ?? null,
            method: req.method,
            url: req.originalUrl
        }
    }
}

module.exports = {
    createHttpResponse,
    createHttpError
}