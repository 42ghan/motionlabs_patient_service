USE motionlabs;

/* Create table */
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(16) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
		chart_number VARCHAR(32) DEFAULT '',
    resident_registration_number CHAR(14) NOT NULL,
    address VARCHAR(255) DEFAULT NULL,
		memo VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_patients_unique ON patients (name, phone_number, chart_number);
CREATE INDEX idx_patients_name_phone ON patients (name, phone_number);
