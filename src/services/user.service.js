const userRepository =
    require("../repositories/user.repository");

const roleRepository =
    require("../repositories/role.repository");

const departmentRepository =
    require("../repositories/department.repository");

const { hashPassword } =
    require("../utils/bcrypt");

const ApiError =
    require("../utils/ApiError");

const ROLES =
    require("../constants/roles");


class UserService {

    // =====================================================
    // GET ALL USERS
    // =====================================================

    async getAllUsers() {

        return await userRepository.findAll();

    }


    // =====================================================
    // GET USER BY ID
    // =====================================================

    async getUserById(userId) {

        const user =
            await userRepository.findById(
                userId
            );

        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }

        return user;

    }


    // =====================================================
    // VALIDATE ROLE
    //
    // Allowed roles:
    // ADMIN
    // HOD
    //
    // HR ROLE IS NOT ALLOWED
    // =====================================================

    async validateRole(roleId) {

        const role =
            await roleRepository.findById(
                roleId
            );

        if (!role) {

            throw new ApiError(
                400,
                "Invalid role_id"
            );

        }


        const allowedRoles = [
            ROLES.ADMIN,
            ROLES.HOD
        ];


        if (
            !allowedRoles.includes(
                role.role_name
            )
        ) {

            throw new ApiError(
                400,
                "Only ADMIN and HOD roles are allowed"
            );

        }


        return role;

    }


    // =====================================================
    // VALIDATE DEPARTMENT
    // =====================================================

    async validateDepartment(
        departmentId
    ) {

        if (!departmentId) {
            return null;
        }


        const department =
            await departmentRepository.findById(
                departmentId
            );


        if (!department) {

            throw new ApiError(
                400,
                "Invalid department_id"
            );

        }


        return department;

    }


    // =====================================================
    // CREATE USER
    // =====================================================

    async createUser(userData) {

        const {
            role_id,
            department_id,
            employee_id,
            full_name,
            email,
            mobile,
            password,
            status
        } = userData;


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !role_id ||
            !full_name ||
            !employee_id ||
            !email ||
            !password
        ) {

            throw new ApiError(
                400,
                "Required fields: role_id, full_name, employee_id, email, password"
            );

        }


        // -------------------------------------------------
        // VALIDATE ROLE
        // -------------------------------------------------

        await this.validateRole(
            role_id
        );


        // -------------------------------------------------
        // VALIDATE DEPARTMENT
        // -------------------------------------------------

        await this.validateDepartment(
            department_id
        );


        // -------------------------------------------------
        // CHECK EMPLOYEE ID
        // -------------------------------------------------

        const existingEmployee =
            await userRepository.findByEmployeeId(
                employee_id
            );


        if (existingEmployee) {

            throw new ApiError(
                400,
                "Employee ID is already registered"
            );

        }


        // -------------------------------------------------
        // CHECK EMAIL
        // -------------------------------------------------

        const existingUser =
            await userRepository.findByEmail(
                email
            );


        if (existingUser) {

            throw new ApiError(
                400,
                "Email is already registered"
            );

        }


        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const hashedPassword =
            await hashPassword(
                password
            );


        // -------------------------------------------------
        // CREATE USER
        // -------------------------------------------------

        try {

            const newUserId =
                await userRepository.create({

                    role_id,

                    department_id,

                    employee_id,

                    full_name,

                    email,

                    mobile,

                    password: hashedPassword,

                    status

                });


            return await userRepository.findById(
                newUserId
            );

        } catch (error) {

            if (
                error.sqlState === "45000"
            ) {

                throw new ApiError(
                    400,
                    error.message
                );

            }

            throw error;

        }

    }


    // =====================================================
    // UPDATE USER
    // =====================================================

    async updateUser(
        userId,
        userData
    ) {

        const {
            role_id,
            department_id,
            employee_id,
            full_name,
            email,
            mobile,
            status
        } = userData;


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !role_id ||
            !full_name ||
            !employee_id ||
            !email
        ) {

            throw new ApiError(
                400,
                "Required fields: role_id, full_name, employee_id, email"
            );

        }


        // -------------------------------------------------
        // GET EXISTING USER
        // -------------------------------------------------

        const user =
            await userRepository.findById(
                userId
            );


        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }


        // -------------------------------------------------
        // VALIDATE ROLE
        // -------------------------------------------------

        await this.validateRole(
            role_id
        );


        // -------------------------------------------------
        // VALIDATE DEPARTMENT
        // -------------------------------------------------

        await this.validateDepartment(
            department_id
        );


        // -------------------------------------------------
        // CHECK EMPLOYEE ID
        // -------------------------------------------------

        const existingEmployee =
            await userRepository.findByEmployeeId(
                employee_id
            );


        if (
            existingEmployee &&
            existingEmployee.user_id !==
                parseInt(userId)
        ) {

            throw new ApiError(
                400,
                "Employee ID is already in use"
            );

        }


        // -------------------------------------------------
        // CHECK EMAIL
        // -------------------------------------------------

        const existingUser =
            await userRepository.findByEmail(
                email
            );


        if (
            existingUser &&
            existingUser.user_id !==
                parseInt(userId)
        ) {

            throw new ApiError(
                400,
                "Email is already in use by another user"
            );

        }


        // -------------------------------------------------
        // UPDATE USER
        // -------------------------------------------------

        try {

            await userRepository.update(

                userId,

                {
                    role_id,

                    department_id,

                    employee_id,

                    full_name,

                    email,

                    mobile,

                    status:
                        status ||
                        user.status
                }

            );


            return await userRepository.findById(
                userId
            );

        } catch (error) {

            if (
                error.sqlState === "45000"
            ) {

                throw new ApiError(
                    400,
                    error.message
                );

            }

            throw error;

        }

    }


    // =====================================================
    // DELETE USER
    // =====================================================

    async deleteUser(
        userId
    ) {

        const user =
            await userRepository.findById(
                userId
            );


        if (!user) {

            throw new ApiError(
                404,
                "User not found"
            );

        }


        return await userRepository.delete(
            userId
        );

    }

}


module.exports =
    new UserService();