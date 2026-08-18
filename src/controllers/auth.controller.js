const authService =
    require("../services/auth.service");

const ApiResponse =
    require("../utils/ApiResponse");


// =====================================================
// LOGIN
// =====================================================

const login = async (
    req,
    res,
    next
) => {

    try {

        const {
            employeeId,
            password
        } = req.body;


        const result =
            await authService.login(
                employeeId,
                password
            );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Logged in successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};



// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword = async (
    req,
    res,
    next
) => {

    try {

        const {
            email
        } = req.body;


        const result =
            await authService
                .forgotPassword(
                    email
                );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "OTP sent successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};



// =====================================================
// VERIFY OTP
// =====================================================

const verifyOtp = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            otp
        } = req.body;


        const result =
            await authService
                .verifyOtp(
                    email,
                    otp
                );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "OTP verified successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};



// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (
    req,
    res,
    next
) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;


        const result =
            await authService
                .resetPassword(
                    email,
                    otp,
                    newPassword
                );


        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    result,
                    "Password reset successfully"
                )
            );

    } catch (error) {

        next(error);

    }

};



// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    login,

    forgotPassword,

    verifyOtp,

    resetPassword

};