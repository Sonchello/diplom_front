import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Register: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Все поля обязательны для заполнения");
      return;
    }
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', { name, email, password });
      if (response.data.message === "Пользователь успешно зарегистрирован") {
        alert("Регистрация прошла успешно!");
        navigate('/login');
      } else {
        setError("Ошибка при регистрации: " + response.data.message);
      }
    } catch (error) {
      setError("Ошибка при регистрации. Проверьте введённые данные.");
    }
  };

  return (
    <div className="auth-container">
      <div className="welcome-message">
        <h1>Создайте аккаунт</h1>
        <p>Присоединяйтесь к нашему сообществу</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label>Имя:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
        <button type="submit" className="auth-button">Зарегистрироваться</button>
      </form>

      <div className="auth-links">
        Уже есть аккаунт?
        <Link to="/login">Войдите</Link>
      </div>
    </div>
  );
};

export default Register;