-- Clear existing just in case (though H2 drops usually for in-memory)
DELETE FROM profile_tags;
DELETE FROM user_skills;
DELETE FROM profiles;

-- Inject 5 test candidate profiles (Local / Dynamic fuzzed) + 5 Global Hub Profiles
-- Group A: Local Fuzzed test cases (Assume SF Area roughly for fallback tests)
INSERT INTO profiles (id, username, full_name, latitude, longitude) VALUES 
('11111111-1111-1111-1111-111111111111', 'alexc', 'Alex Chen', 37.7749, -122.4194),
('22222222-2222-2222-2222-222222222222', 'priyan', 'Priya Nair', 37.7845, -122.3995),
('33333333-3333-3333-3333-333333333333', 'jdoe', 'John Doe', 37.7600, -122.4200),
('44444444-4444-4444-4444-444444444444', 'sams', 'Sam Smith', 37.8000, -122.4000),
('55555555-5555-5555-5555-555555555555', 'klee', 'Kelly Lee', 37.7710, -122.4100);

-- Group B: Global Featured Hubs
INSERT INTO profiles (id, username, full_name, latitude, longitude) VALUES 
('66666666-6666-6666-6666-666666666666', 'marcor', 'Marco Ricci', 45.4642, 9.1900),       -- Milan
('77777777-7777-7777-7777-777777777777', 'emilyt', 'Emily Tran', 40.7128, -74.0060),     -- New York
('88888888-8888-8888-8888-888888888888', 'rajp', 'Raj Patel', 12.9716, 77.5946),         -- Bangalore
('99999999-9999-9999-9999-999999999999', 'liamw', 'Liam Wong', 51.5074, -0.1278),        -- London
('00000000-0000-0000-0000-000000000000', 'sophia', 'Sophia Kim', 52.5200, 13.4050);      -- Berlin

-- Inject skills for test users
INSERT INTO user_skills (skill_name, proficiency_level, user_id) VALUES 
('Java', 'Advanced', '11111111-1111-1111-1111-111111111111'),
('React', 'Advanced', '11111111-1111-1111-1111-111111111111'),
('Node.js', 'Intermediate', '22222222-2222-2222-2222-222222222222'),
('SQL', 'Intermediate', '22222222-2222-2222-2222-222222222222'),
('Java', 'Beginner', '33333333-3333-3333-3333-333333333333'),
('React', 'Intermediate', '44444444-4444-4444-4444-444444444444'),
('Node.js', 'Advanced', '55555555-5555-5555-5555-555555555555'),
('Java', 'Advanced', '66666666-6666-6666-6666-666666666666'),
('Spring Boot', 'Advanced', '77777777-7777-7777-7777-777777777777'),
('React', 'Intermediate', '88888888-8888-8888-8888-888888888888'),
('SQL', 'Advanced', '99999999-9999-9999-9999-999999999999'),
('Java', 'Intermediate', '00000000-0000-0000-0000-000000000000');

-- Inject Lifestyle Tags (Vibe)
INSERT INTO profile_tags (user_id, tag) VALUES
('11111111-1111-1111-1111-111111111111', 'Workout Mode 🏋️'),
('11111111-1111-1111-1111-111111111111', 'Coffee Addict ☕'),
('22222222-2222-2222-2222-222222222222', 'Night Owl 🦉'),
('22222222-2222-2222-2222-222222222222', 'Gym Rat 🏋️'),
('33333333-3333-3333-3333-333333333333', 'Early Bird 🌅'),
('44444444-4444-4444-4444-444444444444', 'Coffee Addict ☕'),
('55555555-5555-5555-5555-555555555555', 'Night Owl 🦉'),
('66666666-6666-6666-6666-666666666666', 'Gym Rat 🏋️'),
('77777777-7777-7777-7777-777777777777', 'Early Bird 🌅'),
('88888888-8888-8888-8888-888888888888', 'Coffee Addict ☕'),
('99999999-9999-9999-9999-999999999999', 'Night Owl 🦉'),
('00000000-0000-0000-0000-000000000000', 'Gym Rat 🏋️');
