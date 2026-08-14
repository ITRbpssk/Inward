const ApiError = require("../utils/ApiError");

/**
 * Middleware to restrict access to specific roles.
 * @param {string[]} allowedRoles Array of role names that are permitted
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role_name) {
                throw new ApiError(403, "Access denied: Role information missing");
            }

            if (!allowedRoles.includes(req.user.role_name)) {
                throw new ApiError(403, "Access denied: Insufficient permissions");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = roleMiddleware;

