const { httpResponse, httpError } = require("../utils/httpResponse")

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
        const { id } = req.params
        
        // Simulate validation error
        if (!id || isNaN(id)) {
            const error = new Error('Invalid user ID')
            error.status = 400
            throw error
        }
        
        // Simulate user not found
        if (id === '999') {
            const error = new Error('User not found')
            error.status = 404
            throw error
        }
        
        const data = { 
            user: { 
                id: parseInt(id), 
                name: 'Demo User',
                email: `user${id}@example.com`
            } 
        }
        
        return httpResponse(req, res, 200, 'User found successfully', data)
        
    } catch (error) {
        return httpError(req, res, error)
    }
}