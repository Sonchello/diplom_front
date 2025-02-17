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
  faCheck,
  faLeaf,
  faHandsHelping,
  faCity,
  faWrench,
  faComments,
  faTrash
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
  try {
    let iconUrl: string;
    // Значительно увеличиваем размер для всех иконок
    const iconSize: L.PointTuple = [128, 128] as L.PointTuple;
    const iconAnchor: L.PointTuple = [64, 128] as L.PointTuple;
    const popupAnchor: L.PointTuple = [0, -128] as L.PointTuple;

    switch (category) {
      case 'planting':
        iconUrl = '/images/markers/tree.png';
        break;
      case 'transport':
        iconUrl = '/images/markers/marker-transport-bus.png';
        break;
      case 'repair':
        iconUrl = '/images/markers/repair.png';
        break;
      case 'communication':
        iconUrl = '/images/markers/talk.png';
        break;
      case 'new':
        iconUrl = '/images/markers/new.png';
        break;
      case 'fundraising':
        iconUrl = '/images/markers/marker-fundraising.png';
        break;
      case 'other':
        iconUrl = '/images/markers/other.png';
        break;
      default:
        iconUrl = `/images/markers/marker-${category}.png`;
    }

    console.log('Creating icon for category:', category, 'with URL:', iconUrl);

    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      popupAnchor: popupAnchor,
      className: 'custom-marker-icon'
    });
  } catch (error) {
    console.warn(`Ошибка загрузки иконки для категории ${category}, использую стандартную`, error);
    return new L.Icon.Default();
  }
};

// Обновляем функцию создания иконки кластера
const createClusterIcon = (cluster: any) => {
  return L.divIcon({
    html: `<div class="custom-marker-cluster"><span>${cluster.getChildCount()}</span></div>`,
    className: '',
    iconSize: L.point(90, 90, true) // Увеличиваем размер кластера
  });
};

// Создаем иконку для медицинской категории
const medicalMarkerIcon = new L.Icon({
  iconUrl: '/path/to/marker_med.png', // Убедитесь, что этот путь правильный
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -57],
  shadowSize: [57, 57]
});

// Обновляем объект с категориями
const categories = [
  {
    value: 'ecological',
    label: 'Экология',
    icon: faBroom,
    subcategories: [
      {
        value: 'cleaning',
        label: 'Уборка территории',
        icon: faBroom,
        markerIcon: createCustomIcon('cleaning'),
        color: '#4CAF50'
      },
      {
        value: 'planting',
        label: 'Посадка деревьев',
        icon: faLeaf,
        markerIcon: createCustomIcon('planting'),
        color: '#2E7D32'
      }
    ]
  },
  {
    value: 'social',
    label: 'Социальная помощь',
    icon: faHandsHelping,
    subcategories: [
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
        value: 'communication',
        label: 'Общение',
        icon: faComments,
        markerIcon: createCustomIcon('communication'),
        color: '#03A9F4'
      }
    ]
  },
  {
    value: 'infrastructure',
    label: 'Инфраструктура',
    icon: faCity,
    subcategories: [
      {
        value: 'transport',
        label: 'Транспорт',
        icon: faCar,
        markerIcon: createCustomIcon('transport'),
        color: '#00BCD4'
      },
      {
        value: 'fundraising',
        label: 'Сбор средств',
        icon: faHandHoldingDollar,
        markerIcon: createCustomIcon('fundraising'),
        color: '#2196F3'
      },
      {
        value: 'repair',
        label: 'Ремонт',
        icon: faWrench,
        markerIcon: createCustomIcon('repair'),
        color: '#607D8B'
      }
    ]
  },
  {
    value: 'housekeeping',
    label: 'Бытовая помощь',
    icon: faBroom,
    subcategories: [
      {
        value: 'cleaning',
        label: 'Уборка помещений',
        icon: faBroom,
        markerIcon: createCustomIcon('cleaning'),
        color: '#8BC34A'
      }
    ]
  },
  {
    value: 'other',
    label: 'Другое',
    icon: faQuestion,
    markerIcon: createCustomIcon('other'),
    color: '#757575'
  }
];

// Создаем стандартную метку для нового запроса
const newMarkerIcon = createCustomIcon('new');

// Измените иконку на красный цвет
const redMarkerIcon = new L.Icon({
  iconUrl: '/path/to/red-marker-icon.png',
  iconSize: [96, 96] as L.PointTuple,
  iconAnchor: [48, 96] as L.PointTuple,
  popupAnchor: [0, -96] as L.PointTuple,
  shadowSize: [96, 96] as L.PointTuple,
  shadowAnchor: [30, 96] as L.PointTuple
});

// Создаем иконку для маркера пользователя
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-marker-inner"></div>',
  iconSize: [64, 64],
  iconAnchor: [32, 32]
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
  selectedRequest: Request | null;
  mapRef: React.RefObject<L.Map | null>;
}

// Компонент для обработки кликов на карте
const MapClickHandler: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void }> = ({ onClick }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  requests, 
  onRequestAdded, 
  userId, 
  userLocation,
  selectedRequest,
  mapRef
}) => {
  // Удаляем старую ссылку на карту, так как теперь она передается через пропсы
  // const mapRef = React.useRef<L.Map | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  const handleDeleteRequest = async (requestId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Ошибка: токен не найден. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }

      const response = await axios.delete(
        `http://localhost:8080/api/requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('Response:', response.data);
      onRequestAdded();
      alert('Запрос успешно удален!');
    } catch (error: any) {
      console.error('Ошибка при удалении запроса:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/login';
        return;
      }
      
      alert('Ошибка при удалении запроса: ' + (error.response?.data || error.message));
    }
  };

  // Функция для определения местоположения
  const getCurrentPosition = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается вашим браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  useEffect(() => {
    let watchId: number;

    const initializeLocation = async () => {
      try {
        // Сначала пробуем получить точное местоположение
        const position = await getCurrentPosition();
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > 10000) {
          console.warn('Низкая точность определения местоположения:', accuracy, 'метров');
          setLocationError('Точность определения местоположения слишком низкая. Проверьте настройки геолокации.');
          return;
        }

        console.log('Получены начальные координаты:', { latitude, longitude, accuracy: accuracy + ' метров' });

        if (mapRef.current) {
          // Удаляем предыдущий маркер
          if (userMarker) {
            userMarker.remove();
          }

          // Создаем новый маркер
          const newMarker = L.marker(
            [latitude, longitude],
            { 
              icon: userLocationIcon,
              zIndexOffset: 1000
            }
          )
            .addTo(mapRef.current)
            .bindPopup('<div class="user-location-popup">Вы здесь</div>');

          setUserMarker(newMarker);
          setLocationError(null);

          // Центрируем карту только при первой инициализации
          if (!locationInitialized) {
            mapRef.current.setView([latitude, longitude], 15);
            setLocationInitialized(true);
          }
        }

        // Начинаем отслеживание местоположения
        watchId = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const { latitude: newLat, longitude: newLng, accuracy: newAccuracy } = watchPosition.coords;
            
            if (newAccuracy > 10000) {
              console.warn('Низкая точность при обновлении местоположения:', newAccuracy, 'метров');
              return;
            }

            if (mapRef.current && userMarker) {
              const newLatLng = new L.LatLng(newLat, newLng);
              userMarker.setLatLng(newLatLng);
            }
          },
          (error) => {
            console.error('Ошибка отслеживания местоположения:', error);
            let errorMessage = 'Ошибка определения местоположения: ';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'доступ запрещен. Разрешите доступ к геолокации в настройках браузера.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'информация о местоположении недоступна. Проверьте подключение к интернету и GPS.';
                break;
              case error.TIMEOUT:
                errorMessage += 'превышено время ожидания. Попробуйте еще раз.';
                break;
              default:
                errorMessage += 'неизвестная ошибка. Попробуйте обновить страницу.';
            }
            
            setLocationError(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } catch (error: any) {
        console.error('Ошибка инициализации местоположения:', error);
        let errorMessage = 'Не удалось определить местоположение. ';
        
        if (error instanceof GeolocationPositionError) {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Вы запретили доступ к геолокации. Пожалуйста, разрешите доступ в настройках браузера.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Информация о местоположении недоступна. Проверьте подключение к интернету и GPS.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Превышено время ожидания определения местоположения. Попробуйте еще раз.';
              break;
            default:
              errorMessage += 'Произошла неизвестная ошибка. Попробуйте обновить страницу.';
          }
        } else {
          errorMessage += error.message || 'Неизвестная ошибка';
        }
        
        setLocationError(errorMessage);
      }
    };

    initializeLocation();

    // Очистка при размонтировании
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (userMarker && mapRef.current) {
        userMarker.remove();
      }
    };
  }, []);

  // Показываем ошибку, если она есть
  useEffect(() => {
    if (locationError) {
      alert(locationError);
    }
  }, [locationError]);

  // Добавляем эффект для отслеживания выбранного запроса
  useEffect(() => {
    if (selectedRequest && mapRef.current) {
      // Находим маркер выбранного запроса
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      markers.forEach((marker) => {
        const markerLatLng = (marker as any)._latlng;
        if (markerLatLng && 
            markerLatLng.lat === selectedRequest.latitude && 
            markerLatLng.lng === selectedRequest.longitude) {
          // Симулируем клик по маркеру
          marker.dispatchEvent(new Event('click'));
        }
      });
    }
  }, [selectedRequest]);

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
            {requests.map((request) => {
              let markerIcon;
              const mainCategory = categories.find(cat => 
                cat.subcategories?.some(sub => sub.value === request.category) || cat.value === request.category
              );
              
              console.log('Request category:', request.category);
              console.log('Found main category:', mainCategory);
              
              if (mainCategory && mainCategory.subcategories) {
                const subCategory = mainCategory.subcategories.find(sub => sub.value === request.category);
                console.log('Found subcategory:', subCategory);
                if (request.category === 'fundraising') {
                  markerIcon = createCustomIcon('fundraising');
                } else {
                  markerIcon = subCategory?.markerIcon || newMarkerIcon;
                }
              } else if (mainCategory) {
                markerIcon = mainCategory.markerIcon || newMarkerIcon;
              } else {
                markerIcon = newMarkerIcon;
              }

              console.log('Using marker icon:', markerIcon);

              return (
                <Marker
                  key={request.id}
                  position={[request.latitude, request.longitude]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="request-popup">
                      <h3>
                        <FontAwesomeIcon icon={mainCategory?.icon || faQuestion} />
                        {mainCategory?.label || 'Неизвестная категория'}
                      </h3>
                      
                      <div className="category-info">
                        <FontAwesomeIcon icon={faTag} />
                        Категория: {mainCategory?.label}
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
                        request.userId === userId ? (
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} /> Удалить запрос
                          </button>
                        ) : (
                          <button 
                            className="help-button"
                            onClick={() => handleHelpProvided(request.id)}
                          >
                            <FontAwesomeIcon icon={faCheck} /> Помощь оказана
                          </button>
                        )
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
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
                        cat.subcategories ? (
                          <optgroup key={cat.value} label={cat.label}>
                            {cat.subcategories.map(subcat => (
                              <option key={subcat.value} value={subcat.value}>
                                {subcat.label}
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        )
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
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;