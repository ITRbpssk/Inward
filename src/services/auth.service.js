const crypto = require("crypto");

const userRepository =
    require("../repositories/user.repository");

const {
    comparePassword,
    hashPassword
} = require("../utils/bcrypt");

const {
    generateToken
} = require("../utils/jwt");

const {
    sendOtpEmail
} = require("../utils/email");

const ApiError =
    require("../utils/ApiError");


class AuthService {


    // =====================================================
    // LOGIN
    // =====================================================

    async login(employeeId, password) {

        if (!employeeId || !password) {

            throw new ApiError(
                400,
                "Employee ID and password are required"
            );

        }


        const user =
            await userRepository
                .findByEmployeeId(
                    employeeId
                );


        if (!user) {

            throw new ApiError(
                401,
                "Invalid employee ID or password"
            );

        }


        if (user.status !== "active") {

            throw new ApiError(
                403,
                "Your account is inactive. Please contact administrator."
            );

        }


        const isPasswordMatch =
            await comparePassword(
                password,
                user.password
            );


        if (!isPasswordMatch) {

            throw new ApiError(
                401,
                "Invalid employee ID or password"
            );

        }


        // =================================================
        // JWT PAYLOAD
        // =================================================

        const payload = {

            user_id:
                user.user_id,

            employeeId:
                user.employee_id,

            role_id:
                user.role_id,

            role_name:
                user.role_name,

            department_id:
                user.department_id

        };


        const token =
            generateToken(payload);


        // =================================================
        // UPDATE LAST LOGIN
        // =================================================

        await userRepository
            .updateLastLogin(
                user.user_id
            );


        return {

            user: {

                user_id:
                    user.user_id,

                full_name:
                    user.full_name,

                employeeId:
                    user.employee_id,

                role_name:
                    user.role_name,

                department_id:
                    user.department_id,

                department_code:
                    user.department_code,

                department_name:
                    user.department_name

            },

            token

        };

    }



    // =====================================================
    // FORGOT PASSWORD
    // =====================================================

    async forgotPassword(email) {

        if (!email) {

            throw new ApiError(
                400,
                "Email is required"
            );

        }


        const user =
            await userRepository
                .findByEmail(email);


        if (!user) {

            throw new ApiError(
                404,
                "No account found with this email"
            );

        }


        if (user.status !== "active") {

            throw new ApiError(
                403,
                "Your account is inactive"
            );

        }


        // =================================================
        // INVALIDATE PREVIOUS OTP
        // =================================================

        await userRepository
            .invalidateOldOtps(
                user.user_id
            );


        // =================================================
        // GENERATE 6 DIGIT OTP
        // =================================================

        const otp =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        // =================================================
        // HASH OTP
        // =================================================

        const otpHash =
            await hashPassword(otp);


        // =================================================
        // OTP EXPIRY - 10 MINUTES
        // =================================================

        const expiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // =================================================
        // SAVE OTP
        // =================================================

        await userRepository
            .createPasswordResetOtp(
                user.user_id,
                otpHash,
                expiresAt
            );


        // =================================================
        // SEND EMAIL
        // =================================================

        await sendOtpEmail(
            user.email,
            user.full_name,
            otp
        );


        return {

            email:
                user.email,

            message:
                "OTP sent successfully"

        };

    }



    // =====================================================
    // VERIFY OTP
    // =====================================================

    async verifyOtp(
        email,
        otp
    ) {

        if (!email || !otp) {

            throw new ApiError(
                400,
                "Email and OTP are required"
            );

        }


        const user =
            await userRepository
                .findByEmail(email);


        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }


        const resetOtp =
            await userRepository
                .findLatestPasswordResetOtp(
                    user.user_id
                );


        if (!resetOtp) {

            throw new ApiError(
                400,
                "OTP not found or expired"
            );

        }


        // =================================================
        // CHECK ALREADY VERIFIED
        // =================================================

        if (resetOtp.verified_at) {

            throw new ApiError(
                400,
                "OTP already used"
            );

        }


        // =================================================
        // CHECK EXPIRY
        // =================================================

        if (
            new Date(
                resetOtp.expires_at
            ) < new Date()
        ) {

            throw new ApiError(
                400,
                "OTP has expired"
            );

        }


        // =================================================
        // MAX ATTEMPTS
        // =================================================

        if (
            resetOtp.attempts >= 5
        ) {

            throw new ApiError(
                429,
                "Too many OTP attempts"
            );

        }


        // =================================================
        // COMPARE OTP
        // =================================================

        const isOtpValid =
            await comparePassword(
                otp,
                resetOtp.otp_hash
            );


        if (!isOtpValid) {

            await userRepository
                .incrementOtpAttempts(
                    resetOtp.id
                );


            throw new ApiError(
                400,
                "Invalid OTP"
            );

        }


        // =================================================
        // MARK OTP VERIFIED
        // =================================================

        await userRepository
            .markOtpVerified(
                resetOtp.id
            );


        return {

            user_id:
                user.user_id,

            verified:
                true

        };

    }



    // =====================================================
    // RESET PASSWORD
    // =====================================================

    async resetPassword(
        email,
        otp,
        newPassword
    ) {

        if (
            !email ||
            !otp ||
            !newPassword
        ) {

            throw new ApiError(
                400,
                "Email, OTP and new password are required"
            );

        }


        // =================================================
        // PASSWORD VALIDATION
        // =================================================

        if (
            newPassword.length < 6
        ) {

            throw new ApiError(
                400,
                "Password must be at least 6 characters"
            );

        }


        // =================================================
        // FIND USER
        // =================================================

        const user =
            await userRepository
                .findByEmail(email);


        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }


        // =================================================
        // FIND OTP
        // =================================================

        const resetOtp =
            await userRepository
                .findLatestPasswordResetOtp(
                    user.user_id
                );


        if (!resetOtp) {

            throw new ApiError(
                400,
                "OTP not found"
            );

        }


        // =================================================
        // OTP MUST BE VERIFIED
        // =================================================

        if (
            !resetOtp.verified_at
        ) {

            throw new ApiError(
                400,
                "Please verify OTP first"
            );

        }


        // =================================================
        // CHECK EXPIRY
        // =================================================

        if (
            new Date(
                resetOtp.expires_at
            ) < new Date()
        ) {

            throw new ApiError(
                400,
                "OTP has expired"
            );

        }


        // =================================================
        // VERIFY OTP AGAIN
        // =================================================

        const isOtpCorrect =
            await comparePassword(
                otp,
                resetOtp.otp_hash
            );


        if (!isOtpCorrect) {

            throw new ApiError(
                400,
                "Invalid OTP"
            );

        }


        // =================================================
        // HASH NEW PASSWORD
        // =================================================

        const hashedPassword =
            await hashPassword(
                newPassword
            );


        // =================================================
        // UPDATE PASSWORD
        // =================================================

        const updated =
            await userRepository
                .updatePassword(
                    user.user_id,
                    hashedPassword
                );


        if (!updated) {

            throw new ApiError(
                500,
                "Failed to update password"
            );

        }


        return {

            message:
                "Password reset successfully"

        };

    }

}


module.exports =
    new AuthService();