const { httpResponse, httpError } = require("../utils/httpResponse")
const { logger } = require('../utils/logger')

exports.self = (req, res) => {
    try {
        // Simulate database call or business logic
        const data = { 
            user: { 
                id: 1, 
                name: 'John',
                email: 'john@example.com'
            } 
        }
        
        return httpResponse(req, res, 200, 'User retrieved successfully', data)
        
    } catch (error) {
        // Correct usage of httpError
        return httpError(req, res, error, 400)
    }   
}

exports.getUserById = (req, res) => {
   try {
        logger.info('Fetching user', { userId: req.params.id })
        // Your logic here
        logger.debug('User data retrieved', { user: userData })
        return httpResponse(req, res, 200, 'Success', userData)
    } catch (error) {
        logger.error('Failed to fetch user', { 
            userId: req.params.id, 
            error: error.message 
        })
        return httpError(req, res, error)
    }
}