-- Create production and development databases for Kusher Space
-- Run as a user with adequate privileges (root or admin user)

CREATE DATABASE IF NOT EXISTS `kushvjkc_prod` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `kushvjkc_dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create/Grant user (adjust host as necessary)
-- WARNING: Running these statements will create the user if it does not exist and grant privileges
-- Replace 'localhost' with '%' if remote access is required
CREATE USER IF NOT EXISTS 'kushvjkc_shurukn'@'localhost' IDENTIFIED BY 'Christina4032';
GRANT ALL PRIVILEGES ON `kushvjkc_prod`.* TO 'kushvjkc_shurukn'@'localhost';
GRANT ALL PRIVILEGES ON `kushvjkc_dev`.* TO 'kushvjkc_shurukn'@'localhost';
FLUSH PRIVILEGES;
