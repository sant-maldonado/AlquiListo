CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  expenses INTEGER,
  rooms INTEGER NOT NULL,
  square_meters INTEGER,
  age_years INTEGER,
  address VARCHAR(255) NOT NULL,
  neighborhood VARCHAR(100),
  accepts_pets BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused', 'rented')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity VARCHAR(40) NOT NULL
    CHECK (amenity IN ('balcon', 'cochera', 'pileta', 'parrilla', 'terraza', 'lavadero', 'aire_acondicionado', 'amueblado', 'seguridad_24hs', 'gimnasio')),
  UNIQUE (property_id, amenity)
);

CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_property_amenities_property_id ON property_amenities(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
