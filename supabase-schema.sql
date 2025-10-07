-- Crear tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT true,
    favorite_platform VARCHAR(255) DEFAULT 'Sin preferencias',
    schedule JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de listas de juegos
CREATE TABLE game_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    list_type VARCHAR(50) NOT NULL, -- 'playing', 'completed', 'dropped', 'wishlist', 'recommendations'
    game_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, list_type)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_public ON users(is_public);
CREATE INDEX idx_game_lists_user_id ON game_lists(user_id);
CREATE INDEX idx_game_lists_type ON game_lists(list_type);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_lists ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para usuarios
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas de seguridad para listas de juegos
CREATE POLICY "Users can view public game lists" ON game_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = game_lists.user_id 
            AND users.is_public = true
        )
    );

CREATE POLICY "Users can view their own game lists" ON game_lists
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own game lists" ON game_lists
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_lists_updated_at BEFORE UPDATE ON game_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
