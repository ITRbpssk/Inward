const express = require("express");

const router = express.Router();

const roleController =
    require("../controllers/role.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const roleMiddleware =
    require("../middlewares/role.middleware");

const ROLES =
    require("../constants/roles");


router.use(authMiddleware);


// Admin can view roles

router.get(
    "/",
    roleMiddleware([ROLES.ADMIN]),
    roleController.getAllRoles
);


router.get(
    "/:id",
    roleMiddleware([ROLES.ADMIN]),
    roleController.getRoleById
);


router.get(
    "/name/:name",
    roleMiddleware([ROLES.ADMIN]),
    roleController.getRoleByName
);


module.exports = router;