const express = require("express");
const path = require('path');

const globalErrorHandler = require('./middleware/globalErrorHandler')
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'../','public')))

// Router
app.use('/api/v1/health', require('./router/healthRoutes'))
app.use('/api/v1',require('./router/apiRouter'))

// 404 handler for unmatched routes
app.use((req, res,next) => {
    const error = new Error(`Route ${req.originalUrl} not found`)
    error.statusCode = 404
    next(error)
})

// Global error handler (must be last)
app.use(globalErrorHandler)

module.exports = app;
