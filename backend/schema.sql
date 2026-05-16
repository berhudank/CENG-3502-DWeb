-- Create the database
CREATE DATABASE IF NOT EXISTS flyticket_db;
USE flyticket_db;

-- 1. Cities Table
-- Represents the 81 Cities of Türkiye.
CREATE TABLE Cities (
                        city_id VARCHAR(10) PRIMARY KEY, -- e.g., 'IST', 'ANK', 'IZM'
                        city_name VARCHAR(100) NOT NULL
);

-- 2. Flights Table
-- Stores all flight details. Departure and arrival times are DATETIME.
CREATE TABLE Flights (
                         flight_id VARCHAR(20) PRIMARY KEY, -- e.g., 'TK101'
                         from_city VARCHAR(10) NOT NULL,
                         to_city VARCHAR(10) NOT NULL,
                         departure_time DATETIME NOT NULL,
                         arrival_time DATETIME NOT NULL,
                         price DECIMAL(10, 2) NOT NULL, -- DECIMAL is best for currency 
                         seats_total INT NOT NULL, 
                         seats_available INT NOT NULL, 
                         FOREIGN KEY (from_city) REFERENCES Cities(city_id),
    FOREIGN KEY (to_city) REFERENCES Cities(city_id)
    );

-- 3. Admins Table
-- Stores admin login credentials.
CREATE TABLE Admins (
                        username VARCHAR(50) PRIMARY KEY, 
                        password VARCHAR(255) NOT NULL -- Storing the hashed password, never plain text 
    );

-- 4. Bookings Table (Future-proofed)
-- Represents a customer's overall transaction.
CREATE TABLE Bookings (
                          booking_id VARCHAR(50) PRIMARY KEY,
                          passenger_name VARCHAR(100) NOT NULL,
                          passenger_surname VARCHAR(100) NOT NULL, 
    passenger_email VARCHAR(150) NOT NULL, 
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ticket_Segments Table (Future-proofed for transit flights)
-- Links a specific flight to a booking.
CREATE TABLE Ticket_Segments (
                                 ticket_id VARCHAR(50) PRIMARY KEY, 
                                 booking_id VARCHAR(50) NOT NULL,
    flight_id VARCHAR(20) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    segment_order INT DEFAULT 1, -- e.g., 1 for direct flight. If transit, next flight is 2.
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id),
    UNIQUE KEY unique_flight_seat (flight_id, seat_number)
    );

-- Indexes for performance on frequently searched columns
CREATE INDEX idx_flight_search ON Flights (from_city, to_city, departure_time);
CREATE INDEX idx_runway_departure ON Flights (from_city, departure_time);
CREATE INDEX idx_runway_arrival ON Flights (to_city, arrival_time);

-- Insert cities
INSERT INTO Cities (city_id, city_name) VALUES
('IST', 'Istanbul'),
('ANK', 'Ankara'),
('IZM', 'Izmir'),
('AYT', 'Antalya'),
('ADA', 'Adana'),
('ADI', 'Adiyaman'),
('AFY', 'Afyonkarahisar'),
('AGR', 'Agri'),
('AMA', 'Amasya'),
('ART', 'Artvin'),
('AYD', 'Aydin'),
('BAL', 'Balikesir'),
('BIL', 'Bilecik'),
('BIN', 'Bingol'),
('BIT', 'Bitlis'),
('BOL', 'Bolu'),
('BUR', 'Burdur'),
('BRS', 'Bursa'),
('CAN', 'Canakkale'),
('CNK', 'Cankiri'),
('COR', 'Corum'),
('DEN', 'Denizli'),
('DIY', 'Diyarbakir'),
('EDI', 'Edirne'),
('ELA', 'Elazig'),
('ERC', 'Erzincan'),
('ERZ', 'Erzurum'),
('ESK', 'Eskisehir'),
('GAZ', 'Gaziantep'),
('GIR', 'Giresun'),
('GUM', 'Gumushane'),
('HAK', 'Hakkari'),
('HAT', 'Hatay'),
('ISP', 'Isparta'),
('MER', 'Mersin'),
('KAR', 'Kars'),
('KAS', 'Kastamonu'),
('KAY', 'Kayseri'),
('KIR', 'Kirklareli'),
('KRS', 'Kirsehir'),
('KOC', 'Kocaeli'),
('KON', 'Konya'),
('KUT', 'Kutahya'),
('MAL', 'Malatya'),
('MAN', 'Manisa'),
('KAH', 'Kahramanmaras'),
('MAR', 'Mardin'),
('MUG', 'Mugla'),
('MUS', 'Mus'),
('NEV', 'Nevsehir'),
('NIG', 'Nigde'),
('ORD', 'Ordu'),
('RIZ', 'Rize'),
('SAK', 'Sakarya'),
('SAM', 'Samsun'),
('SII', 'Siirt'),
('SIN', 'Sinop'),
('SIV', 'Sivas'),
('TEK', 'Tekirdag'),
('TOK', 'Tokat'),
('TRA', 'Trabzon'),
('TUN', 'Tunceli'),
('SAN', 'Sanliurfa'),
('USA', 'Usak'),
('VAN', 'Van'),
('YOZ', 'Yozgat'),
('ZON', 'Zonguldak'),
('AKS', 'Aksaray'),
('BAY', 'Bayburt'),
('KRM', 'Karaman'),
('KRK', 'Kirikkale'),
('BAT', 'Batman'),
('SIR', 'Sirnak'),
('BAR', 'Bartin'),
('ARD', 'Ardahan'),
('IGD', 'Igdir'),
('YAL', 'Yalova'),
('KRB', 'Karabuk'),
('KIL', 'Kilis'),
('OSM', 'Osmaniye'),
('DUZ', 'Duzce')
ON DUPLICATE KEY UPDATE city_name = VALUES(city_name);

-- Admin account
INSERT INTO Admins (username, password) VALUES ('admin', '$2b$10$u.1.ZUVpQVppczTWzkLlre1MxMzTmH.SWz.qE6RslICJ.BxT2Hj6C');