const profileService =
    require("../services/profile.service");

const ApiResponse =
    require("../utils/ApiResponse");


const getMyProfile =
    async (req, res, next) => {

        try {

            const user =
                await profileService.getMyProfile(
                    req.user.user_id
                );

            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        user,
                        "Profile fetched successfully"
                    )
                );

        } catch (error) {

            next(error);

        }

    };


module.exports = {
    getMyProfile
};