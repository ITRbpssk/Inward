const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {

    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = [];

    if (err instanceof ApiError) {

        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors || [];

    } else {

        console.error(err);

        message = err.message || "Internal Server Error";

    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        stack: process.env.NODE_ENV === "development"
            ? err.stack
            : undefined
    });

};

module.exports = errorMiddleware;