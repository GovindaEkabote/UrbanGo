module.exports = {
    HASH_SALT_ROUNDS: 14,
    
    // Success messages
    SUCCESS: 'The operation has been successful',
    
    // Error messages
    SOMETHING_WENT_WRONG: 'Something went wrong',
    VALIDATION_ERROR: 'Validation failed',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: (entity) => `${entity} not found`,
    CONFLICT: (entity) => `${entity} already exists`,
    BAD_REQUEST: 'Bad request',
    
    // Auth messages
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    
    // User messages
    USER_NOT_FOUND: 'User not found',
    USER_EXISTS: 'User already exists',
    
    // Utility function to get appropriate message
    getMessage: (error) => {
        const messages = {
            ValidationError: 'Validation failed',
            CastError: 'Invalid ID format',
            JsonWebTokenError: 'Invalid token',
            TokenExpiredError: 'Token expired',
            default: 'Something went wrong'
        }
        
        return messages[error.name] || messages.default
    }
}