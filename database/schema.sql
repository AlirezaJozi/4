CREATE DATABASE IF NOT EXISTS beauty_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beauty_clinic;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_sessions (
  jti CHAR(36) PRIMARY KEY, admin_id BIGINT UNSIGNED NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE, INDEX idx_session_admin (admin_id, revoked_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_login_challenges (
  id CHAR(36) PRIMARY KEY, admin_id BIGINT UNSIGNED NOT NULL, otp_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL, resend_available_at DATETIME NOT NULL, attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  used_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_challenge_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_challenge_admin_created (admin_id, created_at), INDEX idx_challenge_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(190) NOT NULL, name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE, description TEXT NULL, image VARCHAR(500) NULL, sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, deleted_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_categories_active (is_active, deleted_at, sort_order)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(190) NOT NULL, name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE, category_id BIGINT UNSIGNED NOT NULL, short_description VARCHAR(1000) NULL, description TEXT NULL,
  image_main VARCHAR(500) NULL, image_secondary VARCHAR(500) NULL, price DECIMAL(12,2) NULL, show_price BOOLEAN NOT NULL DEFAULT FALSE, price_text VARCHAR(190) NULL,
  duration_minutes SMALLINT UNSIGNED NULL, complications TEXT NULL, pre_care TEXT NULL, after_care TEXT NULL, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE, published_at DATETIME NULL, deleted_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT,
  INDEX idx_services_public (is_published, deleted_at, sort_order), INDEX idx_services_category (category_id, is_published, deleted_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS service_care_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, service_id BIGINT UNSIGNED NOT NULL, item_type ENUM('complication','pre','after') NOT NULL,
  title VARCHAR(190) NOT NULL, content TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE, INDEX idx_care_service (service_id, item_type, sort_order)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS service_faqs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, service_id BIGINT UNSIGNED NOT NULL, question VARCHAR(500) NOT NULL, answer TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE, INDEX idx_faq_service (service_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portfolio_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(190) NOT NULL, slug VARCHAR(190) NOT NULL UNIQUE, description TEXT NULL, image VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT TRUE, deleted_at DATETIME NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS portfolio_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(190) NOT NULL, slug VARCHAR(190) NOT NULL UNIQUE, category_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NULL, before_image VARCHAR(500) NOT NULL, after_image VARCHAR(500) NOT NULL, description TEXT NULL, sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE, published_at DATETIME NULL, deleted_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE RESTRICT, FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  INDEX idx_portfolio_public (is_published, deleted_at, sort_order), INDEX idx_portfolio_filter (category_id, service_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_branches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(190) NOT NULL, address VARCHAR(500) NULL, phone VARCHAR(40) NULL,
  latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL, google_maps_url VARCHAR(1000) NULL, badge VARCHAR(190) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS working_hours (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT UNSIGNED NOT NULL, weekday TINYINT UNSIGNED NOT NULL, is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIME NULL, end_time TIME NULL, sort_order INT NOT NULL DEFAULT 0, FOREIGN KEY (branch_id) REFERENCES clinic_branches(id) ON DELETE CASCADE,
  UNIQUE KEY uq_working_hour (branch_id, weekday, sort_order), INDEX idx_working_branch_day (branch_id, weekday)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS clinic_closures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT UNSIGNED NOT NULL, closure_date DATE NOT NULL, reason VARCHAR(500) NULL,
  FOREIGN KEY (branch_id) REFERENCES clinic_branches(id) ON DELETE CASCADE, UNIQUE KEY uq_closure (branch_id, closure_date)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS clinic_settings (
  setting_key VARCHAR(190) PRIMARY KEY, setting_value TEXT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consultation_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, phone VARCHAR(30) NOT NULL,
  preferred_date DATE NULL, preferred_time_range VARCHAR(100) NULL, notes TEXT NULL, status ENUM('new','contacting','contacted','completed','cancelled') NOT NULL DEFAULT 'new',
  internal_note TEXT NULL, follow_up_result TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_consult_status_created (status, created_at), INDEX idx_consult_phone (phone)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS consultation_request_services (
  consultation_request_id BIGINT UNSIGNED NOT NULL, service_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY (consultation_request_id, service_id),
  FOREIGN KEY (consultation_request_id) REFERENCES consultation_requests(id) ON DELETE RESTRICT, FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, admin_id BIGINT UNSIGNED NULL, action VARCHAR(100) NOT NULL, entity_type VARCHAR(100) NOT NULL, entity_id BIGINT UNSIGNED NULL,
  metadata JSON NULL, ip_address VARBINARY(16) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL, INDEX idx_activity_admin_created (admin_id, created_at)
) ENGINE=InnoDB;
