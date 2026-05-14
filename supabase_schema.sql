-- ALAS Gamification Web App - Supabase Schema

DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS events CASCADE;
-- 1. Table: events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial mockup events
INSERT INTO events (name, location) VALUES 
('Workshop ALAS - Medellín', 'Medellín'),
('Workshop ALAS - Panamá', 'Panamá'),
('Workshop ALAS - Santiago', 'Santiago'),
('Workshop ALAS - Bogotá', 'Bogotá'),
('Workshop ALAS - México', 'Ciudad de México');

-- 2. Table: sponsors
CREATE TABLE sponsors (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    tier VARCHAR(50) CHECK (tier IN ('gold', 'silver', 'bronze')),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert mockup sponsors for Medellín (event_id = 1)
INSERT INTO sponsors (event_id, name, logo_url, tier, question, options, correct_option, points) VALUES 
(1, 'Sponsor Oro', 'https://via.placeholder.com/100/FFD700', 'gold', '¿Cuál es nuestro producto estrella?', '["Cámara 360", "Sensor de humo", "Alarma básica"]', 0, 200),
(1, 'Sponsor Plata', 'https://via.placeholder.com/100/C0C0C0', 'silver', '¿Año de fundación?', '["1990", "2000", "2010"]', 1, 100),
(1, 'Sponsor Bronce', 'https://via.placeholder.com/100/CD7F32', 'bronze', '¿Oficina principal?', '["Miami", "Bogotá", "Lima"]', 1, 50);

-- 3. Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id INTEGER REFERENCES events(id),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensures an email can only register once per event
    CONSTRAINT unique_user_per_event UNIQUE(email, event_id)
);

-- 4. Table: user_activities
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- e.g., 'sponsor_quiz', 'social', 'colleague', 'survey', 'card'
    sponsor_id INTEGER REFERENCES sponsors(id) ON DELETE SET NULL, -- Only used if activity is sponsor quiz
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure user can't repeat the same activity type (unless it's a quiz, then unique per sponsor)
    -- This is a bit tricky to enforce purely in SQL constraints without a partial index, but we handle it in JS.
    CONSTRAINT unique_quiz_per_sponsor UNIQUE (user_id, sponsor_id)
);

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For a public-facing prototype where users don't have authenticated accounts 
-- (no Supabase Auth login, just email entry), we need to allow public access.
-- In a real production app, consider using Row Level Security (RLS) properly.
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public READ access to events
CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);

-- Create policy to allow public READ access to sponsors
CREATE POLICY "Allow public read sponsors" ON sponsors FOR SELECT USING (true);

-- Create policy to allow public READ and INSERT to users
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

-- Create policy to allow public READ and INSERT to activities
CREATE POLICY "Allow public read activities" ON user_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON user_activities FOR INSERT WITH CHECK (true);
