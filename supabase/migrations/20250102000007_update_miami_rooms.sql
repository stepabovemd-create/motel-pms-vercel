-- Update Miami Motel rooms to use 1-12 and 14 (skipping 13)
-- Clear existing room data first
DELETE FROM rooms;

-- Insert Miami Motel rooms (1-12, 14) - all standard type
INSERT INTO rooms (room_number, room_type, status) VALUES
  ('1', 'standard', 'available'),
  ('2', 'standard', 'available'),
  ('3', 'standard', 'available'),
  ('4', 'standard', 'available'),
  ('5', 'standard', 'available'),
  ('6', 'standard', 'available'),
  ('7', 'standard', 'available'),
  ('8', 'standard', 'available'),
  ('9', 'standard', 'available'),
  ('10', 'standard', 'available'),
  ('11', 'standard', 'available'),
  ('12', 'standard', 'available'),
  ('14', 'standard', 'available')
ON CONFLICT (room_number) DO NOTHING;
