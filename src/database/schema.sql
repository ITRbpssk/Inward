-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS feedback_details;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS parameters;
DROP TABLE IF EXISTS surveys;
DROP TABLE IF EXISTS department_mappings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS roles;

-- 1. ROLES TABLE
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USERS TABLE
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    department_id INT NULL, -- Can be NULL for system admins
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(20) NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id),
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DEPARTMENT_MAPPINGS TABLE
CREATE TABLE department_mappings (
    mapping_id INT AUTO_INCREMENT PRIMARY KEY,
    from_department_id INT NOT NULL,
    to_department_id INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mappings_from_dept FOREIGN KEY (from_department_id) REFERENCES departments (department_id),
    CONSTRAINT fk_mappings_to_dept FOREIGN KEY (to_department_id) REFERENCES departments (department_id),
    CONSTRAINT uq_from_to_dept UNIQUE (from_department_id, to_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SURVEYS TABLE
CREATE TABLE surveys (
    survey_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('draft', 'active', 'inactive', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PARAMETERS TABLE
CREATE TABLE parameters (
    parameter_id INT AUTO_INCREMENT PRIMARY KEY,
    parameter_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    display_order INT DEFAULT 0,
    weightage DECIMAL(5,2) DEFAULT 0.00, -- e.g. 0 to 100 percentage
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. FEEDBACKS TABLE
CREATE TABLE feedbacks (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    from_department_id INT NOT NULL,
    to_department_id INT NOT NULL,
    submitted_by INT NOT NULL,
    submitted_on TIMESTAMP NULL,
    overall_comment TEXT NULL,
    status ENUM('draft', 'submitted') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedbacks_survey FOREIGN KEY (survey_id) REFERENCES surveys (survey_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedbacks_from_dept FOREIGN KEY (from_department_id) REFERENCES departments (department_id),
    CONSTRAINT fk_feedbacks_to_dept FOREIGN KEY (to_department_id) REFERENCES departments (department_id),
    CONSTRAINT fk_feedbacks_user FOREIGN KEY (submitted_by) REFERENCES users (user_id),
    CONSTRAINT uq_survey_from_to UNIQUE (survey_id, from_department_id, to_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. FEEDBACK_DETAILS TABLE
CREATE TABLE feedback_details (
    feedback_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    parameter_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_details_feedback FOREIGN KEY (feedback_id) REFERENCES feedbacks (feedback_id) ON DELETE CASCADE,
    CONSTRAINT fk_details_parameter FOREIGN KEY (parameter_id) REFERENCES parameters (parameter_id),
    CONSTRAINT uq_feedback_parameter UNIQUE (feedback_id, parameter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TRIGGERS TO ENFORCE ONE HOD PER DEPARTMENT
DELIMITER //

CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE is_hod BOOLEAN DEFAULT FALSE;
    DECLARE hod_exists INT DEFAULT 0;
    
    -- Check if the role of the user being inserted is 'HOD'
    SELECT (role_name = 'HOD') INTO is_hod FROM roles WHERE role_id = NEW.role_id;
    
    IF is_hod = TRUE AND NEW.department_id IS NOT NULL THEN
        SELECT COUNT(*) INTO hod_exists 
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.department_id = NEW.department_id AND r.role_name = 'HOD' AND u.status = 'active';
        
        IF hod_exists > 0 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'A department can have only one active HOD.';
        END IF;
    END IF;
END;
//

CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    DECLARE is_hod BOOLEAN DEFAULT FALSE;
    DECLARE hod_exists INT DEFAULT 0;
    
    -- Check if the role of the user being updated is 'HOD'
    SELECT (role_name = 'HOD') INTO is_hod FROM roles WHERE role_id = NEW.role_id;
    
    IF is_hod = TRUE AND NEW.department_id IS NOT NULL AND NEW.status = 'active' THEN
        SELECT COUNT(*) INTO hod_exists 
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.department_id = NEW.department_id 
          AND r.role_name = 'HOD' 
          AND u.status = 'active'
          AND u.user_id != NEW.user_id;
        
        IF hod_exists > 0 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'A department can have only one active HOD.';
        END IF;
    END IF;
END;
//

DELIMITER ;
