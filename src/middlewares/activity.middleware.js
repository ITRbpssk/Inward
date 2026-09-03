const {
    logActivity
} = require("../utils/activityLogger");


// =====================================================
// ACTIVITY MIDDLEWARE
// =====================================================
//
// Logs successful authenticated write operations.
//
// IMPORTANT:
// authMiddleware MUST run before this middleware.
//
// Example:
//
// router.use(authMiddleware);
// router.use(activityMiddleware);
//
// =====================================================


const activityMiddleware = (
    req,
    res,
    next
) => {

    // -------------------------------------------------
    // Store original res.end
    // -------------------------------------------------

    const originalEnd = res.end;


    // -------------------------------------------------
    // Override res.end
    // -------------------------------------------------

    res.end = function (...args) {

        try {

            // Restore original res.end
            res.end = originalEnd;


            // -------------------------------------------------
            // ONLY LOG AUTHENTICATED USERS
            // -------------------------------------------------

            if (
                !req.user ||
                !req.user.user_id
            ) {

                return originalEnd.apply(
                    res,
                    args
                );

            }


            // -------------------------------------------------
            // DO NOT LOG GET REQUESTS
            // -------------------------------------------------

            if (
                String(req.method).toUpperCase() === "GET"
            ) {

                return originalEnd.apply(
                    res,
                    args
                );

            }


            // -------------------------------------------------
            // ONLY LOG SUCCESSFUL REQUESTS
            // 200 - 299
            // -------------------------------------------------

            if (
                res.statusCode < 200 ||
                res.statusCode >= 300
            ) {

                return originalEnd.apply(
                    res,
                    args
                );

            }


            // -------------------------------------------------
            // MODULE
            // -------------------------------------------------

            const module =
                getModuleFromUrl(
                    req.originalUrl
                );


            // -------------------------------------------------
            // ACTION
            // -------------------------------------------------

            const action =
                getActionFromMethod(
                    req.method
                );


            // -------------------------------------------------
            // DESCRIPTION
            // -------------------------------------------------

            const description =
                buildDescription(
                    req,
                    action,
                    module
                );


            // -------------------------------------------------
            // IP ADDRESS
            // -------------------------------------------------

            const ipAddress =
                getClientIp(
                    req
                );


            // -------------------------------------------------
            // SAVE ACTIVITY LOG
            //
            // Do NOT await.
            // Logging must never delay API response.
            // -------------------------------------------------

            logActivity({

                userId:
                    req.user.user_id,

                action,

                module,

                description,

                method:
                    req.method,

                endpoint:
                    req.originalUrl,

                ipAddress,

                userAgent:
                    req.headers["user-agent"] || null

            });


        } catch (error) {

            console.error(
                "❌ ACTIVITY MIDDLEWARE ERROR:",
                error.message
            );

        }


        // -------------------------------------------------
        // Continue original response
        // -------------------------------------------------

        return originalEnd.apply(
            res,
            args
        );

    };


    next();

};


// =====================================================
// GET MODULE FROM URL
// =====================================================
//
// Converts API URL into a meaningful module.
//
// Examples:
//
// /api/v1/users/32
//        ↓
// USER MANAGEMENT
//
// /api/v1/departments
//        ↓
// DEPARTMENT MANAGEMENT
//
// /api/v1/surveys
//        ↓
// SURVEY MANAGEMENT
//
// =====================================================

const getModuleFromUrl = (
    url
) => {

    try {

        const path =
            String(url || "")
                .split("?")[0]
                .replace(/\/+$/, "");


        const parts =
            path
                .split("/")
                .filter(Boolean);


        // -------------------------------------------------
        // Find actual resource after /api/v1
        //
        // Example:
        //
        // ["api", "v1", "users", "32"]
        //
        // Resource = users
        // -------------------------------------------------

        let resource = "";


        const apiIndex =
            parts.findIndex(
                part =>
                    String(part).toLowerCase() === "api"
            );


        if (
            apiIndex !== -1 &&
            parts.length > apiIndex + 2
        ) {

            resource =
                parts[
                    apiIndex + 2
                ];

        } else if (
            parts.length >= 1
        ) {

            resource =
                parts[parts.length - 1];

        }


        resource =
            String(resource || "")
                .toLowerCase();


        // -------------------------------------------------
        // Actual module names
        // -------------------------------------------------

        const moduleMap = {

            users:
                "USER MANAGEMENT",

            user:
                "USER MANAGEMENT",


            departments:
                "DEPARTMENT MANAGEMENT",

            department:
                "DEPARTMENT MANAGEMENT",


            surveys:
                "SURVEY MANAGEMENT",

            survey:
                "SURVEY MANAGEMENT",


            parameters:
                "EVALUATION PARAMETERS",

            parameter:
                "EVALUATION PARAMETERS",


            "special-parameters":
                "SPECIAL PARAMETERS",

            "special-parameter":
                "SPECIAL PARAMETERS",


            "department-mappings":
                "DEPARTMENT MAPPING",

            "department-mapping":
                "DEPARTMENT MAPPING",


            "survey-departments":
                "SURVEY DEPARTMENT MAPPING",


            feedbacks:
                "FEEDBACK",

            feedback:
                "FEEDBACK",


            roles:
                "ROLE MANAGEMENT",

            role:
                "ROLE MANAGEMENT",


            profile:
                "PROFILE",


            settings:
                "SETTINGS",


            "hod-reports":
                "HOD REPORTS",

            "admin-reports":
                "ADMIN REPORTS",


            reports:
                "REPORTS"

        };


        return (
            moduleMap[resource] ||
            formatModuleName(resource) ||
            "SYSTEM"
        );


    } catch (error) {

        console.error(
            "❌ MODULE DETECTION ERROR:",
            error.message
        );

        return "SYSTEM";

    }

};


// =====================================================
// FORMAT UNKNOWN MODULE
// =====================================================

const formatModuleName = (
    resource
) => {

    if (!resource) {

        return "";

    }


    return String(resource)

        .replace(/[-_]/g, " ")

        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

};


// =====================================================
// GET ACTION FROM HTTP METHOD
// =====================================================

const getActionFromMethod = (
    method
) => {

    switch (
        String(method || "")
            .toUpperCase()
    ) {

        case "POST":

            return "CREATE";


        case "PUT":

            return "UPDATE";


        case "PATCH":

            return "UPDATE";


        case "DELETE":

            return "DELETE";


        default:

            return "ACTION";

    }

};


// =====================================================
// BUILD DESCRIPTION
// =====================================================
//
// Creates human-readable activity description.
//
// Examples:
//
// Created user
// Updated user #32
// Deleted department #5
// Created survey
//
// =====================================================

const buildDescription = (
    req,
    action,
    module
) => {

    const path =
        String(
            req.originalUrl || ""
        )
            .split("?")[0]
            .replace(/\/+$/, "");


    const parts =
        path
            .split("/")
            .filter(Boolean);


    // -------------------------------------------------
    // Find resource ID
    //
    // Example:
    //
    // /api/v1/users/32
    //
    // ID = 32
    // -------------------------------------------------

    let resourceId = null;


    const lastPart =
        parts.length
            ? parts[parts.length - 1]
            : null;


    if (
        lastPart &&
        /^\d+$/.test(lastPart)
    ) {

        resourceId = lastPart;

    }


    // -------------------------------------------------
    // Remove MANAGEMENT from module
    //
    // USER MANAGEMENT
    //       ↓
    // USER
    // -------------------------------------------------

    const cleanModule =
        String(module || "SYSTEM")
            .replace(
                /\s+MANAGEMENT$/i,
                ""
            )
            .trim()
            .toLowerCase();


    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------

    if (
        action === "CREATE"
    ) {

        return `Created ${cleanModule}`;

    }


    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------

    if (
        action === "UPDATE"
    ) {

        if (resourceId) {

            return `Updated ${cleanModule} #${resourceId}`;

        }

        return `Updated ${cleanModule}`;

    }


    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------

    if (
        action === "DELETE"
    ) {

        if (resourceId) {

            return `Deleted ${cleanModule} #${resourceId}`;

        }

        return `Deleted ${cleanModule}`;

    }


    // -------------------------------------------------
    // DEFAULT
    // -------------------------------------------------

    return (
        `Performed ${
            String(action || "action")
                .toLowerCase()
        } on ${cleanModule}`
    );

};


// =====================================================
// GET CLIENT IP
// =====================================================

const getClientIp = (
    req
) => {

    const forwarded =
        req.headers["x-forwarded-for"];


    if (forwarded) {

        return String(
            forwarded
        )
            .split(",")[0]
            .trim();

    }


    return (
        req.ip ||
        req.socket?.remoteAddress ||
        null
    );

};


// =====================================================
// EXPORT
// =====================================================

module.exports =
    activityMiddleware;