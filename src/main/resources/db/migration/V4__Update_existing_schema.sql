-- Безопасное удаление существующих ограничений
ALTER TABLE help_history DROP CONSTRAINT IF EXISTS help_history_request_id_helper_id_key;
ALTER TABLE help_history DROP CONSTRAINT IF EXISTS help_history_request_id_fkey;
ALTER TABLE help_history DROP CONSTRAINT IF EXISTS help_history_helper_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_user_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_active_helper_id_fkey;
ALTER TABLE user_helped_requests DROP CONSTRAINT IF EXISTS user_helped_requests_user_id_fkey;
ALTER TABLE user_helped_requests DROP CONSTRAINT IF EXISTS user_helped_requests_request_id_fkey;

-- Добавление столбца birth_date, если его нет
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
END $$;

-- Обновление внешних ключей с каскадным удалением
ALTER TABLE requests
    ADD CONSTRAINT requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE requests
    ADD CONSTRAINT requests_active_helper_id_fkey 
    FOREIGN KEY (active_helper_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_helped_requests
    ADD CONSTRAINT user_helped_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_helped_requests
    ADD CONSTRAINT user_helped_requests_request_id_fkey 
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;

ALTER TABLE help_history
    ADD CONSTRAINT help_history_request_id_fkey 
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;

ALTER TABLE help_history
    ADD CONSTRAINT help_history_helper_id_fkey 
    FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE;

-- Добавление нового ограничения уникальности для активных записей
ALTER TABLE help_history ADD CONSTRAINT help_history_unique_active 
    UNIQUE (request_id, helper_id, status) 
    WHERE status = 'IN_PROGRESS'; 