-- Drop tables if they exist
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS onboarding_task_completions;
DROP TABLE IF EXISTS onboarding_tasks;
DROP TABLE IF EXISTS hr_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS practice_providers;
DROP TABLE IF EXISTS practice_infos;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('employee', 'hr')) DEFAULT 'employee',
    status TEXT CHECK(status IN ('full time', 'probation', 'internship')) DEFAULT 'full time',
    salary REAL DEFAULT 0,
    photo TEXT DEFAULT '',
    department TEXT CHECK(department IN ('design', 'hr', 'development', 'QA')) DEFAULT 'development',
    reportingTo TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    isDeleted INTEGER DEFAULT 0,
    leaveBalance REAL DEFAULT 40,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Leave Types table
CREATE TABLE leave_types (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    quota INTEGER NOT NULL,
    description TEXT DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests table
CREATE TABLE leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id TEXT REFERENCES leave_types(id) ON DELETE RESTRICT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    checkIn TEXT NOT NULL,
    checkOut TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Holidays table
CREATE TABLE holidays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT CHECK(type IN ('public', 'optional', 'restricted')) DEFAULT 'public',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Tasks table
CREATE TABLE onboarding_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    link TEXT DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding completions table
CREATE TABLE onboarding_task_completions (
    task_id TEXT REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY(task_id, user_id)
);

-- HR Requests table
CREATE TABLE hr_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    hrNote TEXT DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Practice Infos table
CREATE TABLE practice_infos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    taxId TEXT DEFAULT '',
    npi TEXT DEFAULT '',
    address TEXT DEFAULT '',
    onboardingStep INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Practice Providers table
CREATE TABLE practice_providers (
    id TEXT PRIMARY KEY,
    practice_id TEXT REFERENCES practice_infos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    npi TEXT DEFAULT '',
    taxonomy TEXT DEFAULT '',
    licenseNumber TEXT DEFAULT '',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    isDeleted INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
