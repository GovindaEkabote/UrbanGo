git add .
git commit -am 'feat: Message'
<<<<<<< HEAD
=======
git push origin master  
>>>>>>> dfa71a8 (feat: setup folder structure)



/*
npm start
npm run dev
*/


# Urbango API
A robust, scalable Node.js REST API built with Express.js, MongoDB, and modern development practices. This API serves as the backend for Urbango application with comprehensive error handling, logging, and monitoring capabilities.

# 🚀 Features
1. RESTful API with proper HTTP status codes and response formats
2. Comprehensive Error Handling with global error middleware
3. Structured Logging with Winston (console, file, and MongoDB storage)
4. Health Monitoring with system metrics and database connectivity checks
5. Environment-based Configuration with secure defaults
6. Input Validation with Joi and Mongoose schemas
7. Security Best Practices with helmet, CORS, and rate limiting
8. Database Integration with MongoDB and Mongoose ODM
9. API Documentation with OpenAPI/Swagger

# 📋 Prerequisites
1. Node.js 18+
2. MongoDB 4.4+
3. npm or yarn

# 🛠 Installation
1. Clone the repository
    1. git clone <https://github.com/GovindaEkabote/UrbanGo.git>
    2. cd urbango-api

2. Install dependencies
    1. npm install

3. Environment Configuration
    1. cp .env.example .env

4. Start the application
    # Development
        npm run dev
    # Production
        npm start
    # With Docker
        docker-compose up -d
5. 🏗 Project Structure

'''src/
├── config/                 # Configuration files
│   ├── config.js          # Environment configuration
│   └── database.js        # Database configuration
├── controllers/           # Route controllers
│   ├── apiController.js
│   ├── healthController.js
│   └── logController.js
├── middleware/            # Custom middleware
│   ├── globalErrorHandler.js
│   ├── validation.js
│   └── auth.js
├── models/               # Mongoose models
│   └── User.js
├── routes/               # API routes
│   ├── api.js
│   ├── healthRoutes.js
│   └── authRoutes.js
├── services/             # Business logic
│   ├── userService.js
│   ├── authService.js
│   └── healthService.js
├── types/               # Response types
│   └── types.js
├── utils/               # Utilities
│   ├── logger.js
│   ├── httpResponse.js
│   └── validation.js
├── constants/           # Application constants
│   ├── application.js
│   └── responseMessage.js
└── app.js              # Express application setup'''


# 📈 Monitoring & Logging
1. Log Storage
 - Console: Human-readable logs in development
 - Files: Rotated log files in logs/ directory
 - Database: Structured logs in MongoDB application_logs collection

2. Health Metrics
 - System resources (CPU, memory, disk)
 - Application metrics (uptime, memory usage)
 - Database connectivity and performance
 - External service status

# 🔒 Security
1. Implemented Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- JWT authentication
- Password hashing with bcrypt
- Environment variable protection

# Commit Convention
- feat: add new user registration endpoint
- fix: resolve database connection issue
- docs: update API documentation
- style: format code according to guidelines
- refactor: improve error handling middleware
- test: add unit tests for user service
- chore: update dependencies

# Built with ❤️ by the Urbango Team