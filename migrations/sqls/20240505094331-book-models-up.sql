CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    summary TEXT,
    rating FLOAT,
    pages INTEGER,
    published_on DATE,
    _created_on DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS book_notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    book_id INTEGER,
    notes TEXT NOT NULL,
    is_private INTEGER CHECK( is_private IN (0, 1) ) NOT NULL DEFAULT 1,
    created_on DATETIME NOT NULL,
    modified_on DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (book_id) REFERENCES books (id)
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    note_id INTEGER,
    comment TEXT NOT NULL,
    created_on DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (note_id) REFERENCES book_notes (id)
);

CREATE TABLE IF NOT EXISTS saved_notes (
    user_id INTEGER,
    note_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (note_id) REFERENCES book_notes (id),
    PRIMARY KEY (user_id, note_id)
);