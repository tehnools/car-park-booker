
-- Schema for lot booking only one lot so 1 table is enough
-- temp_bookings is for temporary storage before moving to bookings table
-- better way is using in-mem cache like redis or some kind of queue system, then front end polls the status
-- but for simplicity using another table
CREATE TABLE IF NOT EXISTS temp_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date NULL,
  session_id INTEGER,
  name TEXT
  );


-- comparison table to see if booking is successful
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_date DATETIME2 NOT NULL UNIQUE,
  session_id INTEGER,
  name TEXT
  );

  -- uncomment for rollback
  -- DROP TABLE IF EXISTS temp_bookings;
  -- DROP TABLE IF EXISTS bookings;