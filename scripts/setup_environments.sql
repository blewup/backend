# MySQL setup script for Kusher environments

# Create databases
CREATE DATABASE IF NOT EXISTS kusher_prod;
CREATE DATABASE IF NOT EXISTS kusher_test;
CREATE DATABASE IF NOT EXISTS kusher_dev;

# Create user with access to all environments
CREATE USER IF NOT EXISTS 'kusher_shurukn'@'localhost' IDENTIFIED BY 'Christina4032';
CREATE USER IF NOT EXISTS 'kusher_shurukn'@'%' IDENTIFIED BY 'Christina4032';

# Grant privileges for production
GRANT ALL PRIVILEGES ON kusher_prod.* TO 'kusher_shurukn'@'localhost';
GRANT ALL PRIVILEGES ON kusher_prod.* TO 'kusher_shurukn'@'%';

# Grant privileges for testing
GRANT ALL PRIVILEGES ON kusher_test.* TO 'kusher_shurukn'@'localhost';
GRANT ALL PRIVILEGES ON kusher_test.* TO 'kusher_shurukn'@'%';

# Grant privileges for development
GRANT ALL PRIVILEGES ON kusher_dev.* TO 'kusher_shurukn'@'localhost';
GRANT ALL PRIVILEGES ON kusher_dev.* TO 'kusher_shurukn'@'%';

# Schema creation for Production
USE kusher_prod;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_versions (
    id VARCHAR(36) PRIMARY KEY,
    version_number VARCHAR(20) NOT NULL,
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_url VARCHAR(255) NOT NULL,
    changelog TEXT,
    is_active BOOLEAN DEFAULT true,
    environment ENUM('prod', 'test', 'dev') DEFAULT 'prod'
);

CREATE TABLE IF NOT EXISTS user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    currency INT DEFAULT 0,
    last_login TIMESTAMP,
    environment ENUM('prod', 'test', 'dev') DEFAULT 'prod',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_assets (
    id VARCHAR(36) PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL,
    asset_type ENUM('texture', 'sound', 'model', 'script') NOT NULL,
    version_id VARCHAR(36) NOT NULL,
    download_url VARCHAR(255) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    environment ENUM('prod', 'test', 'dev') DEFAULT 'prod',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES game_versions(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL,
    device_info TEXT,
    expires_at TIMESTAMP NOT NULL,
    environment ENUM('prod', 'test', 'dev') DEFAULT 'prod',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

# Clone schema to Test environment
CREATE DATABASE IF NOT EXISTS kusher_test;
USE kusher_test;

CREATE TABLE IF NOT EXISTS users LIKE kusher_prod.users;
CREATE TABLE IF NOT EXISTS game_versions LIKE kusher_prod.game_versions;
CREATE TABLE IF NOT EXISTS user_progress LIKE kusher_prod.user_progress;
CREATE TABLE IF NOT EXISTS game_assets LIKE kusher_prod.game_assets;
CREATE TABLE IF NOT EXISTS user_sessions LIKE kusher_prod.user_sessions;

# Clone schema to Dev environment
CREATE DATABASE IF NOT EXISTS kusher_dev;
USE kusher_dev;

CREATE TABLE IF NOT EXISTS users LIKE kusher_prod.users;
CREATE TABLE IF NOT EXISTS game_versions LIKE kusher_prod.game_versions;
CREATE TABLE IF NOT EXISTS user_progress LIKE kusher_prod.user_progress;
CREATE TABLE IF NOT EXISTS game_assets LIKE kusher_prod.game_assets;
CREATE TABLE IF NOT EXISTS user_sessions LIKE kusher_prod.user_sessions;

FLUSH PRIVILEGES;