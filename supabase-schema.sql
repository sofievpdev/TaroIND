-- Таблица пользователей для Telegram Tarot Bot
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  readings_balance INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  has_used_free_trial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- Включаем Row Level Security (безопасность)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: разрешаем все операции для authenticated пользователей
CREATE POLICY "Enable all operations for authenticated users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Опционально: история транзакций (для будущего расширения)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  spread_type VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
