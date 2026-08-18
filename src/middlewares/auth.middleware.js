const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {

    try {

        console.log("");
        console.log("========== AUTH MIDDLEWARE ==========");
        console.log("METHOD:", req.method);
        console.log("URL:", req.originalUrl);

        const authHeader =
            req.headers.authorization;

        console.log(
            "AUTH HEADER EXISTS:",
            !!authHeader
        );

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            console.log("❌ TOKEN MISSING");

            throw new ApiError(
                401,
                "Authentication token missing or invalid"
            );

        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            verifyToken(token);

        if (!decoded) {

            console.log("❌ TOKEN INVALID");

            throw new ApiError(
                401,
                "Authentication token expired or invalid"
            );

        }

        console.log("✅ TOKEN VALID");
        console.log(
            "USER ID:",
            decoded.user_id
        );
        console.log(
            "ROLE:",
            decoded.role_name
        );
        console.log(
            "ROLE TYPE:",
            typeof decoded.role_name
        );

        req.user = decoded;

        console.log(
            "========== AUTH COMPLETE =========="
        );

        next();

    } catch (error) {

        next(error);

    }

};

module.exports = authMiddleware;