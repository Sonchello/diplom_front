import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Все поля обязательны для заполнения");
      return;
    }
    try {
      // Отправляем запрос на сервер для аутентификации
      const response = await axios.post('http://localhost:8080/api/auth/login', { email, password });

      // Сохраняем токен и email в localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userEmail', email); // Сохраняем email пользователя

      console.log('Токен сохранен:', response.data.token); // Логирование
      console.log('Email сохранен:', email); // Логирование

      // Перенаправляем на главную страницу
      navigate('/main');
    } catch (error) {
      console.error('Ошибка входа:', error); // Логирование
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="auth-container">
      <div className="welcome-message">
        <h1>Добро пожаловать!</h1>
        <p>Пожалуйста, войдите в свой аккаунт</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Войти</button>
      </form>

      <div className="auth-links">
        Ещё нет аккаунта?
        <Link to="/register">Зарегистрируйтесь</Link>
      </div>
    </div>
  );
};

export default Login;