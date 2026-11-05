CREATE DATABASE IF NOT EXISTS smart_society;
USE smart_society;

CREATE TABLE flats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  block_name VARCHAR(10) NOT NULL,
  flat_number VARCHAR(10) NOT NULL,
  floor_no INT,
  UNIQUE (block_name, flat_number)
);

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','RESIDENT','SECURITY') NOT NULL,
  flat_id BIGINT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flat_id) REFERENCES flats(id)
);

CREATE TABLE family_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  resident_id BIGINT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  relation VARCHAR(30),
  phone VARCHAR(15),
  FOREIGN KEY (resident_id) REFERENCES users(id)
);

CREATE TABLE visitors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  visitor_name VARCHAR(100) NOT NULL,
  visitor_phone VARCHAR(15),
  purpose VARCHAR(200),
  flat_id BIGINT NOT NULL,
  registered_by BIGINT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  entry_time DATETIME NULL,
  exit_time DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flat_id) REFERENCES flats(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE TABLE complaints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  resident_id BIGINT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'OPEN',
  admin_remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES users(id)
);

CREATE TABLE notices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  posted_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id)
);

CREATE TABLE maintenance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  flat_id BIGINT NOT NULL,
  bill_month DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING','PAID') NOT NULL DEFAULT 'PENDING',
  paid_on DATE NULL,
  FOREIGN KEY (flat_id) REFERENCES flats(id),
  UNIQUE (flat_id, bill_month)
);