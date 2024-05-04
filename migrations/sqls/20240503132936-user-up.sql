CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    fullname TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    private_key TEXT,
    _status INTEGER CHECK( _status IN (0, 1) ) NOT NULL DEFAULT 0,
    created_on DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS user_login (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    logged_in DATETIME NOT NULL,
    logged_out DATETIME
);

CREATE TABLE IF NOT EXISTS deactivated_users (
    id INTEGER PRIMARY KEY,
    uid INTEGER,
    fullname TEXT,
    username TEXT,
    deactivated_on DATETIME,
    usage_days INTEGER
);