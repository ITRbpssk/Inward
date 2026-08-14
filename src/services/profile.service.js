const profileRepository =
    require("../repositories/profile.repository");

const ApiError =
    require("../utils/ApiError");


class ProfileService {

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

}


module.exports =
    new ProfileService();