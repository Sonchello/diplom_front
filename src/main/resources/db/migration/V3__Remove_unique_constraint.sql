-- Удаляем старое ограничение уникальности
ALTER TABLE help_history DROP CONSTRAINT IF EXISTS help_history_request_id_helper_id_key;

-- Добавляем новое ограничение, которое учитывает статус
ALTER TABLE help_history ADD CONSTRAINT help_history_unique_active 
    UNIQUE (request_id, helper_id, status) 
    WHERE status = 'IN_PROGRESS'; 