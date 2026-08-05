const userRepository = require("../repositories/user.repository");
const { comparePassword } = require("../utils/bcrypt");
const { generateToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");

class AuthService {
   async login(employeeId, password) {
        if (!employeeId || !password) {
            throw new ApiError(400, "Employee ID and password are required");
        }

        const user = await userRepository.findByEmployeeId(employeeId);
        if (!user) {
            throw new ApiError(401, "Invalid employee ID or password");
        }

        if (user.status !== "active") {
            throw new ApiError(403, "Your account is inactive. Please contact administrator.");
        }

        const isPasswordMatch = await comparePassword(password, user.password);
        if (!isPasswordMatch) {
            throw new ApiError(401, "Invalid employee ID or password");
        }

        // Generate token payload
        const payload = {
            user_id: user.user_id,
            employeeId: user.employee_id,
            role_id: user.role_id,
            role_name: user.role_name,
            department_id: user.department_id
        };

        const token = generateToken(payload);

        // Update last login asynchronously
        await userRepository.updateLastLogin(user.user_id);

        return {
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                employeeId: user.employee_id,
                role_name: user.role_name,
                department_id: user.department_id,
                department_code: user.department_code,
                department_name: user.department_name
            },
            token
        };
    }
}

module.exports = new AuthService();
