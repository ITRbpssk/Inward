const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json(new ApiResponse(200, result, "Logged in successfully"));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login
};
