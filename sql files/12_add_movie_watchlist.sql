USE movie_booking_db;

CREATE TABLE IF NOT EXISTS movie_watchlist (
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    KEY idx_movie_watchlist_movie (movie_id),
    CONSTRAINT fk_movie_watchlist_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_movie_watchlist_movie
        FOREIGN KEY (movie_id) REFERENCES movies (movie_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
