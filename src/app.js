const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const errorMiddleware =
    require("./middlewares/error.middleware");

const ApiError =
    require("./utils/ApiError");


const app = express();


// =====================================================
// CORS CONFIGURATION
// =====================================================

const corsOptions = {

    origin: [
        "http://localhost:4200",
        "http://192.168.1.91:8074"
    ],

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ],

    exposedHeaders: [
        "Authorization"
    ],

    credentials: true,

    optionsSuccessStatus: 204

};


// =====================================================
// GLOBAL CORS MIDDLEWARE
// =====================================================

// IMPORTANT:
// Do NOT add app.options("*", ...)
// Express 5 does not accept "*" like that.
//
// cors() middleware itself handles OPTIONS
// preflight requests.

app.use(
    cors(corsOptions)
);


// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// GLOBAL REQUEST DEBUG
// =====================================================

app.use((req, res, next) => {

    console.log("");
    console.log("========================================");
    console.log("🔥 INCOMING REQUEST");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);

    console.log(
        "ORIGIN:",
        req.headers.origin || "NO ORIGIN"
    );

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

app.use(
    errorMiddleware
);


module.exports = app;