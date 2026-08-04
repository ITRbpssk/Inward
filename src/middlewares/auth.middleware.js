const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Authentication token missing or invalid");
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            throw new ApiError(401, "Authentication token expired or invalid");
        }

        // Decoded payload contains user_id, email, role_id, role_name, department_id
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;
