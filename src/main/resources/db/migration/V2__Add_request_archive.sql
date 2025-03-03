-- Создание таблицы users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    rating INTEGER DEFAULT 0,
    avatar_url VARCHAR(255),
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы requests
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    active_helper_id BIGINT,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    help_start_date TIMESTAMP,
    completion_date TIMESTAMP,
    category VARCHAR(50) NOT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'medium',
    is_archived BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (active_helper_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Создание таблицы user_helped_requests (для истории)
CREATE TABLE user_helped_requests (
    user_id BIGINT NOT NULL,
    request_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, request_id)
);

-- Создание таблицы help_history (для активной помощи)
CREATE TABLE help_history (
    id SERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    helper_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_active_helper_id ON requests(active_helper_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_category ON requests(category);
CREATE INDEX idx_requests_urgency ON requests(urgency);
CREATE INDEX idx_help_history_helper_id ON help_history(helper_id);
CREATE INDEX idx_help_history_status ON help_history(status);
CREATE INDEX idx_help_history_request_id ON help_history(request_id);

-- Добавление ограничений для проверки значений
ALTER TABLE requests ADD CONSTRAINT check_status
    CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

ALTER TABLE requests ADD CONSTRAINT check_urgency
    CHECK (urgency IN ('low', 'medium', 'high'));

ALTER TABLE help_history ADD CONSTRAINT check_help_status
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- Добавление ограничения уникальности для активных записей в help_history
ALTER TABLE help_history ADD CONSTRAINT help_history_unique_active 
    UNIQUE (request_id, helper_id, status) 
    WHERE status = 'IN_PROGRESS';