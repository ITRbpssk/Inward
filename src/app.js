const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
const ApiError = require("./utils/ApiError");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API Routes
app.use("/api/v1", routes);

// Base Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Catch 404 (Route not found)
app.use((req, res, next) => {
    next(new ApiError(404, `API endpoint not found: ${req.originalUrl}`));
});

// Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;
