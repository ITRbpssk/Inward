const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const errorMiddleware =
    require("./middlewares/error.middleware");

const ApiError =
    require("./utils/ApiError");


const app = express();


// =====================================================
// GLOBAL MIDDLEWARES
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// 🔥 GLOBAL REQUEST DEBUG
// =====================================================

app.use((req, res, next) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 INCOMING REQUEST");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);

    console.log(
        "AUTHORIZATION:",
        req.headers.authorization
            ? "TOKEN PRESENT"
            : "NO TOKEN"
    );

    console.log("========================================");
    console.log("");

    next();

});


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/v1",
    routes
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/health",
    (req, res) => {

        console.log("");
        console.log("💚 HEALTH CHECK HIT");
        console.log("");

        res.status(200).json({

            status: "UP",

            timestamp: new Date()

        });

    }
);


// =====================================================
// 404
// =====================================================

app.use(
    (req, res, next) => {

        console.log("");
        console.log("❌ 404 ROUTE NOT FOUND");
        console.log("METHOD:", req.method);
        console.log("URL:", req.originalUrl);
        console.log("");

        next(
            new ApiError(
                404,
                `API endpoint not found: ${req.originalUrl}`
            )
        );

    }
);


// =====================================================
// ERROR MIDDLEWARE
// =====================================================

app.use(errorMiddleware);


module.exports = app;