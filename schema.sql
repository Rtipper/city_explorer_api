DROP TABLE IF EXISTS location;

CREATE TABLE location (
  id SERIAL PRIMARY KEY,
  searchquery  VARCHAR(255),
  formattedquery VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255)
);