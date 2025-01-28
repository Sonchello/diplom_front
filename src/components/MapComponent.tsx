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
  faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Фикс для иконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Функция для создания кастомной иконки маркера
const createCustomIcon = (category: string) => {
  return new L.Icon({
    iconUrl: `/images/markers/marker-${category}.png`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Функция для создания иконки кластера
const createClusterIcon = (cluster: any) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(30, 30, true)
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
    value: 'medical',
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

// Иконка для нового маркера
const newMarkerIcon = createCustomIcon('new');

interface Request {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  urgency?: 'low' | 'medium' | 'high';
  category: string;
}

interface MapComponentProps {
  requests: Request[];
  onRequestAdded: () => void;
  userId: number;
}

// Компонент для обработки кликов на карте
const MapClickHandler: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ requests, onRequestAdded, userId }) => {
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
                      {request.category}
                    </h3>
                    <p>{request.description}</p>
                    <p>Статус: {request.status}</p>
                    {request.urgency && (
                      <p className={`urgency ${request.urgency}`}>
                        Срочность: {
                          request.urgency === 'low' ? 'Низкая' :
                          request.urgency === 'medium' ? 'Средняя' : 'Высокая'
                        }
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {isSelectingLocation && selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={newMarkerIcon}
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