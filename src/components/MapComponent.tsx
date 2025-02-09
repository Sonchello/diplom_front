import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapComponent.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMedkit, 
  faUtensils, 
  faCar, 
  faHome, 
  faTshirt, 
  faQuestion,
  faPlus,
  faBroom,
  faHandHoldingDollar,
  faTag,
  faUser,
  faInfoCircle,
  faExclamationTriangle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Фикс для иконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Обновляем функцию создания кастомной иконки
const createCustomIcon = (category: string) => {
  const defaultIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  try {
    return new L.Icon({
      iconUrl: `/images/markers/marker-${category}.png`,
      iconSize: [90, 90],
      iconAnchor: [45, 90],
      popupAnchor: [0, -90]
    });
  } catch (error) {
    console.warn(`Failed to load custom icon for category ${category}, using default`);
    return defaultIcon;
  }
};

// Обновляем функцию создания иконки кластера
const createClusterIcon = (cluster: any) => {
  return L.divIcon({
    html: `<div class="custom-marker-cluster"><span>${cluster.getChildCount()}</span></div>`,
    className: '',
    iconSize: L.point(70, 70, true)
  });
};

// Создаем объект с категориями
const categories = [
  {
    value: 'cleaning',
    label: 'Уборка',
    icon: faBroom,
    markerIcon: createCustomIcon('cleaning'),
    color: '#4CAF50'
  },
  {
    value: 'clothing',
    label: 'Одежда',
    icon: faTshirt,
    markerIcon: createCustomIcon('clothing'),
    color: '#9C27B0'
  },
  {
    value: 'food',
    label: 'Еда',
    icon: faUtensils,
    markerIcon: createCustomIcon('food'),
    color: '#FF9800'
  },
  {
    value: 'fundraising',
    label: 'Сбор средств',
    icon: faHandHoldingDollar,
    markerIcon: createCustomIcon('fundraising'),
    color: '#2196F3'
  },
  {
    value: 'medical',        // изменено с 'new' на 'medical'
    label: 'Медицинская помощь',
    icon: faMedkit,
    markerIcon: createCustomIcon('medical'),
    color: '#f44336'
  },
  {
    value: 'transport',
    label: 'Транспорт',
    icon: faCar,
    markerIcon: createCustomIcon('transport'),
    color: '#00BCD4'
  },
  {
    value: 'other',
    label: 'Другое',
    icon: faQuestion,
    markerIcon: createCustomIcon('other'),
    color: '#757575'
  }
];

// Создаем стандартную красную метку
const newMarkerIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -57],
  shadowSize: [57, 57]
});

// Создаем иконку для маркера пользователя
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface Request {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  urgency?: 'low' | 'medium' | 'high';
  category: string;
  userName: string;
  userId: number;
  createdAt: string;
}

interface MapComponentProps {
  requests: Request[];
  onRequestAdded: () => void;
  userId: number;
  userLocation: {latitude: number; longitude: number} | null;
}

// Компонент для обработки кликов на карте
const MapClickHandler: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ requests, onRequestAdded, userId, userLocation }) => {
  const mapRef = React.useRef<L.Map | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleStartLocationSelect = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const newPosition: [number, number] = [center.lat, center.lng];
      setSelectedPosition(newPosition);
      setIsSelectingLocation(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPosition || !category || !description) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (!userId || userId === 0) {
      console.error('UserId is invalid:', userId);
      alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите снова.');
      window.location.href = '/login';
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Ошибка: токен не найден. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }

      console.log('Sending request with userId:', userId);
      
      const response = await axios.post(
        'http://localhost:8080/api/requests',
        {
          userId: userId,
          description,
          category,
          latitude: selectedPosition[0],
          longitude: selectedPosition[1],
          urgency,
          status: 'ACTIVE'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('Response:', response.data);
      onRequestAdded();
      setIsSelectingLocation(false);
      setSelectedPosition(null);
      setDescription('');
      setCategory('');
      setUrgency('low');
      
      alert('Запрос успешно создан!');
    } catch (error: any) {
      console.error('Ошибка при создании запроса:', error);
      console.error('Детали ошибки:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }
      
      alert('Ошибка при создании запроса: ' + (error.response?.data || error.message));
    }
  };

  const handleHelpProvided = async (requestId: number) => {
    if (!userId || userId === 0) {
      console.error('UserId is invalid:', userId);
      alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите снова.');
      window.location.href = '/login';
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Ошибка: токен не найден. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }

      console.log('Sending help provided request with userId:', userId);
      
      const response = await axios.post(
        `http://localhost:8080/api/requests/${requestId}/help`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('Response:', response.data);
      onRequestAdded();
      setIsSelectingLocation(false);
      setSelectedPosition(null);
      setDescription('');
      setCategory('');
      setUrgency('low');
      
      alert('Помощь успешно оказана!');
    } catch (error: any) {
      console.error('Ошибка при оказании помощи:', error);
      console.error('Детали ошибки:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }
      
      alert('Ошибка при оказании помощи: ' + (error.response?.data || error.message));
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      // Запрашиваем местоположение с высокой точностью
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            // Создаем маркер пользователя
            const userMarker = L.marker(
              [latitude, longitude],
              { 
                icon: userLocationIcon,
                zIndexOffset: 1000
              }
            )
              .addTo(mapRef.current)
              .bindPopup('<div class="user-location-popup">Вы здесь</div>');

            // Центрируем карту на местоположении пользователя
            mapRef.current.setView([latitude, longitude], 15);  // увеличиваем зум до 15

            // Очищаем маркер при размонтировании
            return () => {
              if (mapRef.current) {
                userMarker.remove();
              }
            };
          }
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error);
          alert('Не удалось определить ваше местоположение. Пожалуйста, разрешите доступ к геолокации в настройках браузера.');
        },
        {
          enableHighAccuracy: true,  // Включаем высокую точность
          timeout: 5000,             // Таймаут в 5 секунд
          maximumAge: 0              // Всегда получаем свежие данные
        }
      );
    } else {
      alert('Ваш браузер не поддерживает геолокацию');
    }
  }, [mapRef.current]); // Перезапускаем эффект только при изменении mapRef.current

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', flex: 1 }}>
      {!isSelectingLocation && (
        <button 
          onClick={handleStartLocationSelect}
          className="create-request-button"
        >
          Создать запрос
        </button>
      )}

      <div className="custom-zoom-control">
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>−</button>
      </div>

      <div style={{ height: '100%', width: '100%' }}>
        <MapContainer
          center={[59.9343, 30.3351]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {isSelectingLocation && (
            <MapClickHandler onClick={(e) => {
              const { lat, lng } = e.latlng;
              setSelectedPosition([lat, lng]);
            }} />
          )}

          <MarkerClusterGroup 
            chunkedLoading
            iconCreateFunction={createClusterIcon}
          >
            {requests.map((request) => (
              <Marker
                key={request.id}
                position={[request.latitude, request.longitude]}
                icon={categories.find(cat => cat.value === request.category)?.markerIcon}
              >
                <Popup>
                  <div className="request-popup">
                    <h3>
                      <FontAwesomeIcon icon={categories.find(cat => cat.value === request.category)?.icon || faQuestion} />
                      {categories.find(cat => cat.value === request.category)?.label || 'Неизвестная категория'}
                    </h3>
                    
                    <div className="category-info">
                      <FontAwesomeIcon icon={faTag} />
                      Категория: {categories.find(cat => cat.value === request.category)?.label}
                    </div>
                    
                    <div className="description">
                      <strong>Описание:</strong>
                      <p>{request.description}</p>
                    </div>
                    
                    <div className="user-info">
                      <FontAwesomeIcon icon={faUser} /> Автор: {request.userName}
                    </div>
                    
                    <div className="status">
                      <FontAwesomeIcon icon={faInfoCircle} /> Статус: {
                        request.status === 'ACTIVE' ? 'Активный' :
                        request.status === 'COMPLETED' ? 'Выполнен' : 
                        request.status
                      }
                    </div>
                    
                    {request.urgency && (
                      <div className={`urgency ${request.urgency}`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Срочность: {
                          request.urgency === 'low' ? 'Низкая' :
                          request.urgency === 'medium' ? 'Средняя' : 'Высокая'
                        }
                      </div>
                    )}
                    
                    {request.status === 'ACTIVE' && (
                      <button 
                        className="help-button"
                        onClick={() => handleHelpProvided(request.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Помощь оказана
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {isSelectingLocation && selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={category ? categories.find(cat => cat.value === category)?.markerIcon : newMarkerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  setSelectedPosition([pos.lat, pos.lng]);
                },
                mouseover: (e) => {
                  const marker = e.target;
                  marker.openPopup();
                }
              }}
            >
              <Popup 
                closeButton={false}
                autoClose={false}
                closeOnClick={false}
              >
                <div className="request-form-popup">
                  <h3>Новый запрос</h3>
                  <div className="form-group">
                    <label>Описание:</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      placeholder="Опишите ваш запрос..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Категория:</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          <FontAwesomeIcon icon={cat.icon} /> {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Срочность:</label>
                    <div className="urgency-buttons">
                      <button
                        type="button"
                        className={`urgency-button low ${urgency === 'low' ? 'active' : ''}`}
                        onClick={() => setUrgency('low')}
                      >
                        Низкая
                      </button>
                      <button
                        type="button"
                        className={`urgency-button medium ${urgency === 'medium' ? 'active' : ''}`}
                        onClick={() => setUrgency('medium')}
                      >
                        Средняя
                      </button>
                      <button
                        type="button"
                        className={`urgency-button high ${urgency === 'high' ? 'active' : ''}`}
                        onClick={() => setUrgency('high')}
                      >
                        Высокая
                      </button>
                    </div>
                  </div>
                  <div className="form-buttons">
                    <button onClick={handleSubmit} className="submit-button">
                      Создать
                    </button>
                    <button 
                      onClick={() => {
                        setIsSelectingLocation(false);
                        setSelectedPosition(null);
                      }} 
                      className="cancel-button"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          <div className="category-legend">
            <h4>Категории запросов:</h4>
            {categories.map(cat => (
              <div key={cat.value} className="legend-item">
                <div 
                  className="legend-icon" 
                  style={{ backgroundColor: cat.color }}
                >
                  <FontAwesomeIcon icon={cat.icon} />
                </div>
                <span className="legend-text">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;