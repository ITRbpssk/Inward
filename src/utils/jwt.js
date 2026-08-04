const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret_key", {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
