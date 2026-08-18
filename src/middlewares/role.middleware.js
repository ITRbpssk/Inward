const ApiError = require("../utils/ApiError");

const roleMiddleware = (allowedRoles) => {

    return (req, res, next) => {

        console.log("🔥🔥 ROLE MIDDLEWARE FILE EXECUTED 🔥🔥");

        try {

            console.log("");
            console.log("========================================");
            console.log("🔥 ROLE MIDDLEWARE EXECUTED");
            console.log("URL:", req.originalUrl);
            console.log("USER OBJECT:", req.user);
            console.log(
                "USER ROLE:",
                JSON.stringify(req.user?.role_name)
            );
            console.log(
                "USER ROLE TYPE:",
                typeof req.user?.role_name
            );
            console.log(
                "ALLOWED ROLES:",
                allowedRoles
            );
            console.log(
                "ALLOWED ROLES TYPES:",
                allowedRoles.map(
                    role => typeof role
                )
            );

            const userRole =
                String(
                    req.user?.role_name || ""
                )
                .trim()
                .toUpperCase();

            const normalizedAllowedRoles =
                allowedRoles.map(
                    role =>
                        String(role)
                            .trim()
                            .toUpperCase()
                );

            console.log(
                "NORMALIZED USER ROLE:",
                userRole
            );

            console.log(
                "NORMALIZED ALLOWED ROLES:",
                normalizedAllowedRoles
            );

            console.log(
                "IS ALLOWED:",
                normalizedAllowedRoles.includes(
                    userRole
                )
            );

            console.log("========================================");
            console.log("");


            if (
                !req.user ||
                !req.user.role_name
            ) {

                throw new ApiError(
                    403,
                    "Access denied: Role information missing"
                );

            }


            if (
                !normalizedAllowedRoles.includes(
                    userRole
                )
            ) {

                throw new ApiError(
                    403,
                    "Access denied: Insufficient permissions"
                );

            }


            next();

        } catch (error) {

            next(error);

        }

    };

};

module.exports = roleMiddleware;