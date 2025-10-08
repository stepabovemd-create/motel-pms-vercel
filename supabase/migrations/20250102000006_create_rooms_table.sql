-- Create rooms table for room management
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type VARCHAR(50) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'out_of_order')),
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  check_in_date TIMESTAMPTZ,
  check_out_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_guest_id ON rooms(guest_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for service role" ON rooms
  FOR ALL USING (true);

-- Add room_number column to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS room_number VARCHAR(10);

-- Create foreign key constraint
ALTER TABLE guests ADD CONSTRAINT fk_guests_room_number 
  FOREIGN KEY (room_number) REFERENCES rooms(room_number);

-- Insert some sample rooms for Miami Motel
INSERT INTO rooms (room_number, room_type, status) VALUES
  ('101', 'standard', 'available'),
  ('102', 'standard', 'available'),
  ('103', 'standard', 'available'),
  ('104', 'standard', 'available'),
  ('105', 'standard', 'available'),
  ('201', 'standard', 'available'),
  ('202', 'standard', 'available'),
  ('203', 'standard', 'available'),
  ('204', 'standard', 'available'),
  ('205', 'standard', 'available'),
  ('301', 'deluxe', 'available'),
  ('302', 'deluxe', 'available'),
  ('303', 'deluxe', 'available'),
  ('304', 'deluxe', 'available'),
  ('305', 'deluxe', 'available')
ON CONFLICT (room_number) DO NOTHING;
