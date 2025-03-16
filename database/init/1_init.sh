#! /bin/sh

set -e

# Execute SQL commands
mysql -u root -p${MYSQL_ROOT_PASSWORD} <<EOF

/* Create user */
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';

/* Create database */
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};

/* Grant all privileges to user */
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';

/* Flush privileges */
FLUSH PRIVILEGES;	

EOF

# Print success message to stdout and to docker logs
echo "Database and user created successfully" >&2
echo "Database and user created successfully"
