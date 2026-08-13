const roleRepository = require("../repositories/role.repository");
const ApiError = require("../utils/ApiError");

class RoleService {

    async getAllRoles() {

        return await roleRepository.findAll();

    }

    async getRoleById(roleId) {

        const role =
            await roleRepository.findById(roleId);

        if (!role) {
            throw new ApiError(
                404,
                "Role not found"
            );
        }

        return role;

    }

    async getRoleByName(roleName) {

        const role =
            await roleRepository.findByName(roleName);

        if (!role) {
            throw new ApiError(
                404,
                "Role not found"
            );
        }

        return role;

    }

}

module.exports = new RoleService();