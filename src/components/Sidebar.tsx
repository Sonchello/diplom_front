import React, { useState } from 'react';
import './Sidebar.css';

const DEFAULT_AVATAR_URL = 'https://abrakadabra.fun/uploads/posts/2021-12/thumbs/1640528715_49-abrakadabra-fun-p-serii-chelovek-na-avu-56.jpg';

interface Request {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface SidebarProps {
  requests: Request[];
  isOpen: boolean;
  onToggle: () => void;
  currentUser: User | null;
  onAddRequest: () => void; // Функция для открытия формы добавления запроса
}

const Sidebar: React.FC<SidebarProps> = ({ requests, isOpen, onToggle, currentUser, onAddRequest }) => {
  const avatarUrl = currentUser?.avatarUrl || DEFAULT_AVATAR_URL;

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button
        onClick={onToggle}
        className="toggle-button"
        style={{
          position: 'absolute',
          top: '10px',
          right: isOpen ? '10px' : '-40px',
          zIndex: 3,
          transition: 'right 0.3s ease-in-out',
        }}
      >
        ✕
      </button>

      <div className="content">
        {currentUser && (
          <div className="heading">
            <img src={avatarUrl} alt="Аватар" className="user-avatar" />
            <h3>{currentUser.name}</h3>
            <p>{currentUser.email}</p>
          </div>
        )}

        <div className="buttons">
          <div className="tab">
            <button className="button_active">Пункт меню 1</button>
            <button className="button">Пункт меню 2</button>
            <button className="button">Пункт меню 3</button>
          </div>
        </div>

        <div className="sort">
          <h2>Активные запросы</h2>
          <div className="sort_back">
            {requests.map((request) => (
              <div key={request.id} style={{ marginBottom: '10px' }}>
                <h3>Запрос #{request.id}</h3>
                <p>{request.description}</p>
                <p>Статус: {request.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопка для добавления запроса */}
        <button onClick={onAddRequest} className="add-request-button">
          Добавить запрос
        </button>
      </div>
    </div>
  );
};

export default Sidebar;