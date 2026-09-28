function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`
    });
}

function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.status || err.statusCode || 500;
    const message = statusCode === 500
        ? 'Internal Server Error. Please try again later.'
        : err.message || 'An error occurred';

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
