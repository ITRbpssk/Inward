const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
    let { statusCode, message, errors } = err;

    if (!(err instanceof ApiError)) {
        statusCode = err.statusCode;
        message = err.message ;
        errors = [];
    }

    const response = {
        success: false,
        statusCode,
        message,
        errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    };

    // Log the error for internal diagnostics (avoiding winston for simplicity, console is fine)
    if (statusCode === 500) {
        console.error(" Internal Server Error:", err);
    }

    res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
