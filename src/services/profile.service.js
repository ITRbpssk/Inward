const profileRepository =
    require("../repositories/profile.repository");

const ApiError =
    require("../utils/ApiError");

const {
    comparePassword,
    hashPassword
} = require("../utils/bcrypt");


class ProfileService {


    // =====================================================
    // GET MY PROFILE
    // =====================================================

    async getMyProfile(userId) {

        if (!userId) {

            throw new ApiError(
                401,
                "User authentication required"
            );

        }


        const user =
            await profileRepository.findMyProfile(
                userId
            );


        if (!user) {

            throw new ApiError(
                404,
                "Profile not found"
            );

        }


        return user;

    }


    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    async changePassword(
        userId,
        currentPassword,
        newPassword
    ) {

        if (!userId) {

            throw new ApiError(
                401,
                "User authentication required"
            );

        }


        if (!currentPassword || !newPassword) {

            throw new ApiError(
                400,
                "Current password and new password are required"
            );

        }


        if (newPassword.length < 6) {

            throw new ApiError(
                400,
                "New password must be at least 6 characters"
            );

        }


        // =================================================
        // GET USER WITH PASSWORD
        // =================================================

        const user =
            await profileRepository.findUserWithPassword(
                userId
            );


        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }


        // =================================================
        // VERIFY CURRENT PASSWORD
        // =================================================

        const passwordMatch =
            await comparePassword(
                currentPassword,
                user.password
            );


        if (!passwordMatch) {

            throw new ApiError(
                400,
                "Current password is incorrect"
            );

        }


        // =================================================
        // PREVENT SAME PASSWORD
        // =================================================

        const samePassword =
            await comparePassword(
                newPassword,
                user.password
            );


        if (samePassword) {

            throw new ApiError(
                400,
                "New password must be different from current password"
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
            await profileRepository.updatePassword(
                userId,
                hashedPassword
            );


        if (!updated) {

            throw new ApiError(
                500,
                "Failed to update password"
            );

        }


        return true;

    }

}


module.exports =
    new ProfileService();