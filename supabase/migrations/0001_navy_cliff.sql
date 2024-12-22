/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - name (text)
      - email (text, unique)
      - password (text)
      - created_at (timestamp)
    
    - events
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - longitude (float)
      - latitude (float)
      - start_time (timestamp)
      - end_time (timestamp)
      - event_token (text, unique)
      - host_id (uuid, references users)
      - created_at (timestamp)
    
    - participations
      - id (uuid, primary key)
      - event_id (uuid, references events)
      - user_id (uuid, references users)
      - attended (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  longitude float NOT NULL,
  latitude float NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  event_token text UNIQUE NOT NULL,
  host_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are readable by all authenticated users"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Events can be created by authenticated users"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Events can be updated by their hosts"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Events can be deleted by their hosts"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- Participations table
CREATE TABLE participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  attended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participations can be read by authenticated users"
  ON participations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participations can be created by authenticated users"
  ON participations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participations can be updated by the participant"
  ON participations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX events_location_idx ON events USING gist (
  ll_to_earth(latitude, longitude)
);

CREATE INDEX events_time_idx ON events(start_time, end_time);
CREATE INDEX participations_event_user_idx ON participations(event_id, user_id);