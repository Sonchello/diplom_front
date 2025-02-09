import React, { useState } from 'react';
import './Sidebar.css';
import EditProfileModal from './EditProfileModal';

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
}

const Sidebar: React.FC<SidebarProps> = ({ requests, isOpen, onToggle, currentUser, onAddRequest, onUserUpdate }) => {
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
    { value: 'cleaning', label: 'Уборка' },
    { value: 'food', label: 'Еда' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'medical', label: 'Медицинская помощь' },
    { value: 'other', label: 'Другое' }
  ];

  const urgencyOptions = [
    { value: 'all', label: 'Любая срочность' },
    { value: 'low', label: 'Низкая' },
    { value: 'medium', label: 'Средняя' },
    { value: 'high', label: 'Высокая' }
  ];

  const filteredRequests = requests.filter(request => {
    const categoryMatch = selectedCategory === 'all' || request.category === selectedCategory;
    const distanceMatch = !request.distance || (request.distance * 1000) <= maxDistance;
    const urgencyMatch = selectedUrgency === 'all' || request.urgency === selectedUrgency;
    return categoryMatch && distanceMatch && urgencyMatch;
  });

  const getCategoryLabel = (category: string): string => {
    const categories: { [key: string]: string } = {
      'cleaning': 'Уборка',
      'food': 'Еда',
      'transport': 'Транспорт',
      'medical': 'Медицинская помощь',
      'other': 'Другое'
    };
    return categories[category] || category;
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
            className={`menu-tab ${activeTab === 'helped' ? 'active' : ''}`}
            onClick={() => setActiveTab('helped')}
          >
            Оказанная помощь
          </button>
        </div>

        <div className="filters">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select 
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="filter-select"
          >
            {urgencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="distance-filter">
            <label>Расстояние: {formatDistance(maxDistance)}</label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="distance-slider"
            />
          </div>
        </div>

        <div className="requests-list">
          {activeTab === 'active' && (
            <div className="requests-grid">
              {filteredRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-card-header">
                    <span className="request-category-tag">
                      {getCategoryLabel(request.category)}
                    </span>
                    {request.distance && (
                      <span className="request-distance">
                        {formatDistance(request.distance * 1000)}
                      </span>
                    )}
                  </div>
                  
                  <div className="request-card-content">
                    <p className="request-description">{request.description}</p>
                  </div>
                  
                  <div className="request-card-footer">
                    <span className="request-author">{request.userName}</span>
                    {request.urgency && (
                      <span className={`request-urgency-tag ${request.urgency}`}>
                        {getUrgencyLabel(request.urgency)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEditProfileOpen && currentUser && (
          <EditProfileModal
            user={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              avatarUrl: currentUser.avatarUrl || '',
              birthDate: currentUser.birthDate
            }}
            onClose={() => setIsEditProfileOpen(false)}
            onUpdate={() => {
              if (onUserUpdate) {
                onUserUpdate();
              }
              setIsEditProfileOpen(false);
            }}
          />
        )}
      </div>
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