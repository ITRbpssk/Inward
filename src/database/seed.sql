-- SEED INITIAL DATA

-- 1. Roles
INSERT INTO roles (role_id, role_name, description, status) VALUES
(1, 'Admin', 'System Administrator with full access', 'active'),
(2, 'HOD', 'Head of Department with feedback submission and viewing access', 'active'),
(3, 'User', 'Standard department employee', 'active');

-- 2. Departments
INSERT INTO departments (department_id, department_code, department_name, description, status) VALUES
(1, 'HR', 'Human Resources', 'Handles employee relations and recruitment', 'active'),
(2, 'FIN', 'Finance & Accounts', 'Handles financial transactions and audits', 'active'),
(3, 'IT', 'Information Technology', 'Handles infrastructure and software support', 'active'),
(4, 'SALES', 'Sales & Marketing', 'Handles client relations and sales', 'active'),
(5, 'OPS', 'Operations', 'Handles day-to-day operations and production', 'active');

-- 3. Parameters
INSERT INTO parameters (parameter_id, parameter_name, description, display_order, weightage, status) VALUES
(1, 'Responsiveness', 'Speed and promptness of response to queries and requests', 1, 16.66, 'active'),
(2, 'Proactiveness', 'Taking initiative and anticipating needs beforehand', 2, 16.66, 'active'),
(3, 'Professionalism', 'Ethical conduct, politeness, and quality of work', 3, 16.66, 'active'),
(4, 'Domain Expertise', 'Technical knowledge and skill competence', 4, 16.66, 'active'),
(5, 'Communication', 'Clarity, transparency, and frequency of updates', 5, 16.66, 'active'),
(6, 'Continuous Improvement', 'Receptivity to feedback and striving for excellence', 6, 16.70, 'active');

-- 4. Users (Password is 'Password123' for all seeded users)
INSERT INTO users (user_id, role_id, department_id, full_name, email, mobile, password, status) VALUES
-- System Admin (No department)
(1, 1, NULL, 'System Admin', 'admin@example.com', '9876543210', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
-- Department HODs (One HOD per department)
(2, 2, 1, 'Amit Sharma (HR HOD)', 'hr.hod@example.com', '9876543211', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
(3, 2, 2, 'Priya Patel (FIN HOD)', 'finance.hod@example.com', '9876543212', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
(4, 2, 3, 'Rajesh Kumar (IT HOD)', 'it.hod@example.com', '9876543213', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
(5, 2, 4, 'Sanjay Singh (SALES HOD)', 'sales.hod@example.com', '9876543214', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
(6, 2, 5, 'Vikram Malhotra (OPS HOD)', 'ops.hod@example.com', '9876543215', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
-- Regular users / Staff
(7, 3, 3, 'John Doe (IT Staff)', 'it.staff@example.com', '9876543216', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active'),
(8, 3, 1, 'Jane Smith (HR Staff)', 'hr.staff@example.com', '9876543217', '$2b$10$P98SJOPqFvwdWiA3whJVpuHLjaMip5RL2fzjdurmVD3jvirUlUgDS', 'active');

-- 5. Default Department Mappings (Define who evaluates who)
-- E.g. IT (3) evaluates HR (1) and Finance (2)
-- HR (1) evaluates IT (3) and Operations (5)
-- Finance (2) evaluates IT (3) and Sales (4)
-- Sales (4) evaluates Operations (5)
-- Operations (5) evaluates IT (3) and Finance (2)
INSERT INTO department_mappings (from_department_id, to_department_id, status) VALUES
(3, 1, 'active'), -- IT evaluates HR
(3, 2, 'active'), -- IT evaluates Finance
(1, 3, 'active'), -- HR evaluates IT
(1, 5, 'active'), -- HR evaluates Operations
(2, 3, 'active'), -- Finance evaluates IT
(2, 4, 'active'), -- Finance evaluates Sales
(4, 5, 'active'), -- Sales evaluates Operations
(5, 3, 'active'), -- Operations evaluates IT
(5, 2, 'active'); -- Operations evaluates Finance
