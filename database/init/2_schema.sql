USE motionlabs;

/* Create table */
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
		chart_number VARCHAR(32) DEFAULT NULL,
    name VARCHAR(16) NOT NULL,
    resident_registration_number CHAR(15) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    address VARCHAR(255) DEFAULT NULL,
		memo VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		deleted_at TIMESTAMP DEFAULT NULL
);

CREATE UNIQUE INDEX idx_patients_unique ON patients (name, phone_number, chart_number, deleted_at);

CREATE INDEX idx_patients_name_phone_number ON patients (name, phone_number);

CREATE INDEX idx_patients_deleted_at ON patients (deleted_at);
