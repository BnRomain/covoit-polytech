-- CovoitPolytech - Schema initial
-- A executer dans Supabase SQL Editor

-- Table des profils utilisateurs (liee a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'both' CHECK (role IN ('driver', 'passenger', 'both')),
  bio TEXT,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  co2_saved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des trajets
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 3 CHECK (available_seats >= 0),
  estimated_cost_per_person NUMERIC(6,2) NOT NULL DEFAULT 0,
  distance_km NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_days INTEGER[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des reservations
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, passenger_id)
);

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id, trip_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies : profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Policies : trips
CREATE POLICY "Trips are viewable by authenticated users"
  ON trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Drivers can create trips"
  ON trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own trips"
  ON trips FOR UPDATE TO authenticated USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own trips"
  ON trips FOR DELETE TO authenticated USING (auth.uid() = driver_id);

-- Policies : bookings
CREATE POLICY "Users can see bookings for their trips or their own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    passenger_id = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Trip drivers and booking passengers can update bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (
    passenger_id = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
  );

-- Policies : reviews
CREATE POLICY "Reviews are viewable by authenticated users"
  ON reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Policies : messages
CREATE POLICY "Users can see messages for trips they participate in"
  ON messages FOR SELECT TO authenticated
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE driver_id = auth.uid()
      UNION
      SELECT trip_id FROM bookings WHERE passenger_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can send messages for trips they participate in"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND trip_id IN (
      SELECT id FROM trips WHERE driver_id = auth.uid()
      UNION
      SELECT trip_id FROM bookings WHERE passenger_id = auth.uid() AND status = 'accepted'
    )
  );

-- Fonction pour creer automatiquement un profil a l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour creer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
