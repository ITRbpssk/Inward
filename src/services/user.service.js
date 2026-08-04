const userRepository = require("../repositories/user.repository");
const roleRepository = require("../repositories/role.repository");
const departmentRepository = require("../repositories/department.repository");
const { hashPassword } = require("../utils/bcrypt");
const ApiError = require("../utils/ApiError");

class UserService {
    async getAllUsers() {
        return await userRepository.findAll();
    }

    async getUserById(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        return user;
    }

    async createUser(userData) {
        const { role_id, department_id, full_name, email, mobile, password, status } = userData;

        if (!role_id || !full_name || !email || !password) {
            throw new ApiError(400, "Required fields: role_id, full_name, email, password");
        }

        // Check if role exists
        const role = await roleRepository.findById(role_id);
        if (!role) {
            throw new ApiError(400, "Invalid role_id");
        }

        // Check if department exists if provided
        if (department_id) {
            const dept = await departmentRepository.findById(department_id);
            if (!dept) {
                throw new ApiError(400, "Invalid department_id");
            }
        }

        // Check if email already taken
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new ApiError(400, "Email is already registered");
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        try {
            const newUserId = await userRepository.create({
                role_id,
                department_id,
                full_name,
                email,
                mobile,
                password: hashedPassword,
                status
            });
            return await userRepository.findById(newUserId);
        } catch (error) {
            if (error.sqlState === "45000") {
                throw new ApiError(400, error.message);
            }
            throw error;
        }
    }

    async updateUser(userId, userData) {
        const { role_id, department_id, full_name, email, mobile, status } = userData;

        if (!role_id || !full_name || !email) {
            throw new ApiError(400, "Required fields: role_id, full_name, email");
        }

        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Check if email is already taken by someone else
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser && existingUser.user_id !== parseInt(userId)) {
            throw new ApiError(400, "Email is already in use by another user");
        }

        try {
            await userRepository.update(userId, {
                role_id,
                department_id,
                full_name,
                email,
                mobile,
                status: status || user.status
            });
            return await userRepository.findById(userId);
        } catch (error) {
            if (error.sqlState === "45000") {
                throw new ApiError(400, error.message);
            }
            throw error;
        }
    }

    async deleteUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        return await userRepository.delete(userId);
    }
}

module.exports = new UserService();
