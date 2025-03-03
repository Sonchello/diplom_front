import React, { useState } from 'react';
import './Sidebar.css';
import EditProfileModal from './EditProfileModal';
import axios from 'axios';

const DEFAULT_AVATAR_URL = 'https://abrakadabra.fun/uploads/posts/2021-12/thumbs/1640528715_49-abrakadabra-fun-p-serii-chelovek-na-avu-56.jpg';

interface Request {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  distance?: number;
  category: string;
  userName: string;
  urgency?: 'low' | 'medium' | 'high';
  userId: number;
  createdAt: string;
  activeHelper?: { id: number };
  helpHistory?: { 
    id: number;
    helper: { id: number };
    status: string;
    startDate: string;
    endDate?: string;
  }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  birthDate?: string;
}

interface SidebarProps {
  requests: Request[];
  isOpen: boolean;
  onToggle: () => void;
  currentUser: User | null;
  onAddRequest: () => void;
  onUserUpdate?: () => void;
  onRequestClick?: (request: Request) => void;
  onRequestDelete?: (requestId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ requests, isOpen, onToggle, currentUser, onAddRequest, onUserUpdate, onRequestClick, onRequestDelete }) => {
  const avatarUrl = currentUser?.avatarUrl 
    ? `http://localhost:8080${currentUser.avatarUrl}` 
    : DEFAULT_AVATAR_URL;
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(1000);

  const categories = [
    { value: 'all', label: 'Все категории' },
    { 
      value: 'ecological', 
      label: 'Экология',
      subcategories: [
        { value: 'cleaning', label: 'Уборка территории' },
        { value: 'planting', label: 'Посадка деревьев' }
      ]
    },
    { 
      value: 'social', 
      label: 'Социальная помощь',
      subcategories: [
        { value: 'clothing', label: 'Одежда' },
        { value: 'food', label: 'Еда' }
      ]
    },
    { 
      value: 'infrastructure', 
      label: 'Инфраструктура',
      subcategories: [
        { value: 'transport', label: 'Транспорт' },
        { value: 'fundraising', label: 'Сбор средств' }
      ]
    },
    { value: 'other', label: 'Другое' }
  ];

  const urgencyOptions = [
    { value: 'all', label: 'Любая' },
    { value: 'low', label: 'Низкая' },
    { value: 'medium', label: 'Средняя' },
    { value: 'high', label: 'Высокая' }
  ];

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'my') {
      return request.userId === currentUser?.id;
    }
    if (activeTab === 'responses') {
      return request.status === 'IN_PROGRESS' && 
             ((request.activeHelper?.id === currentUser?.id) || 
              (request.helpHistory?.some(help => 
                help.helper.id === currentUser?.id && help.status === 'IN_PROGRESS'
              )));
    }
    if (activeTab === 'helped') {
      return request.activeHelper?.id === currentUser?.id && request.status === 'COMPLETED';
    }
    if (activeTab === 'active') {
      const categoryMatch = selectedCategory === 'all' || request.category === selectedCategory;
      const distanceMatch = !request.distance || (request.distance * 1000) <= maxDistance;
      const urgencyMatch = selectedUrgency === 'all' || request.urgency === selectedUrgency;
      return request.status === 'ACTIVE' && categoryMatch && distanceMatch && urgencyMatch;
    }
    return false;
  });

  console.log('Active tab:', activeTab);
  console.log('All requests:', requests);
  console.log('Current user:', currentUser);
  console.log('Filtered requests:', filteredRequests);

  const getCategoryLabel = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'ecological': 'Экология',
      'cleaning': 'Уборка территории',
      'planting': 'Посадка деревьев',
      'social': 'Социальная помощь',
      'clothing': 'Одежда',
      'food': 'Еда',
      'infrastructure': 'Инфраструктура',
      'transport': 'Транспорт',
      'fundraising': 'Сбор средств',
      'other': 'Другое'
    };
    return categoryMap[category] || category;
  };

  const getStatusLabel = (status: string): string => {
    const statuses: { [key: string]: string } = {
      'ACTIVE': 'Активный',
      'COMPLETED': 'Выполнен'
    };
    return statuses[status] || status;
  };

  const formatDistance = (meters: number) => {
    return meters >= 1000 
      ? `${(meters / 1000).toFixed(1)} км`
      : `${meters} м`;
  };

  const handleRequestClick = (request: Request) => {
    if (onRequestClick) {
      onRequestClick(request);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        alert('Ошибка: токен не найден или пользователь не авторизован. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }

      const response = await axios.delete(
        `http://localhost:8080/api/requests/${requestId}?userId=${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Response:', response.data);
      if (onRequestDelete) {
        onRequestDelete(requestId);
      }
      alert('Запрос успешно удален!');
    } catch (error: any) {
      console.error('Ошибка при удалении запроса:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Неизвестная ошибка при удалении запроса';
      alert(errorMessage);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button onClick={onToggle} className="toggle-button">✕</button>
      
      <div className="content">
        {currentUser && (
          <div className="heading">
            <img src={avatarUrl} alt="Аватар" className="user-avatar" />
            <h3>{currentUser.name}</h3>
            <p>{currentUser.email}</p>
            <button 
              className="edit-profile-button"
              onClick={() => setIsEditProfileOpen(true)}
            >
              Редактировать профиль
            </button>
          </div>
        )}

        <div className="menu-tabs">
          <button 
            className={`menu-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Активные запросы
          </button>
          <button 
            className={`menu-tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Мои запросы
          </button>
          <button 
            className={`menu-tab ${activeTab === 'responses' ? 'active' : ''}`}
            onClick={() => setActiveTab('responses')}
          >
            Отклики
          </button>
          <button 
            className={`menu-tab ${activeTab === 'helped' ? 'active' : ''}`}
            onClick={() => setActiveTab('helped')}
          >
            Оказанная помощь
          </button>
        </div>

        <div className="filters">
          <h4>Фильтры</h4>
          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <div className="urgency-filter">
            <div className="filter-section-title">Срочность</div>
            <div className="urgency-filter-buttons">
              {urgencyOptions.map(option => (
                <button
                  key={option.value}
                  className={`urgency-filter-button ${selectedUrgency === option.value ? 'active' : ''}`}
                  onClick={() => setSelectedUrgency(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="distance-filter">
            <label>
              Максимальное расстояние: {maxDistance / 1000} км
            </label>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="distance-slider"
            />
          </div>
        </div>

        <div className="requests-list">
          <div className="requests-grid">
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className={`request-card urgency-${request.urgency || 'low'}`}
                onClick={() => handleRequestClick(request)}
              >
                <div className="request-card-header">
                  <span className="request-category-tag">
                    {getCategoryLabel(request.category)}
                  </span>
                  <span className={`request-status ${request.status.toLowerCase()}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="request-card-content">
                  <p className="request-description">{request.description}</p>
                </div>

                <div className="request-card-footer">
                  <span className="request-author">
                    {request.userName}
                  </span>
                  {request.distance && (
                    <span className="request-distance">
                      {formatDistance(request.distance)}
                    </span>
                  )}
                  {request.userId === currentUser?.id && (
                    <button
                      className="delete-request-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request.id);
                      }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isEditProfileOpen && currentUser && (
        <EditProfileModal
          user={{
            ...currentUser,
            avatarUrl: currentUser.avatarUrl || DEFAULT_AVATAR_URL
          }}
          onClose={() => setIsEditProfileOpen(false)}
          onUpdate={onUserUpdate || (() => {})}
        />
      )}
    </div>
  );
};

const getUrgencyLabel = (urgency: string): string => {
  const urgencyLabels: { [key: string]: string } = {
    'low': 'Низкая',
    'medium': 'Средняя',
    'high': 'Высокая'
  };
  return urgencyLabels[urgency] || urgency;
};

export default Sidebar;