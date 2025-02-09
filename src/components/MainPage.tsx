import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import Sidebar from './Sidebar';
import './MainPage.css';

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

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
}

const MainPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleGeolocationError = (error: GeolocationPositionError) => {
      console.error('Детали ошибки геолокации:', {
        code: error.code,
        message: error.message,
        PERMISSION_DENIED: error.PERMISSION_DENIED,
        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
        TIMEOUT: error.TIMEOUT
      });

      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert('Пожалуйста, разрешите доступ к геолокации в настройках браузера');
          break;
        case error.POSITION_UNAVAILABLE:
          alert('Не удается получить местоположение. Проверьте подключение к интернету и GPS');
          // Пробуем получить местоположение с меньшей точностью
          getCurrentPosition(false);
          break;
        case error.TIMEOUT:
          alert('Превышено время ожидания. Пробуем еще раз...');
          getCurrentPosition(true);
          break;
      }
    };

    const handlePositionUpdate = (position: GeolocationPosition) => {
      console.log('Успешно получены координаты:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    };

    const getCurrentPosition = (highAccuracy: boolean = true) => {
      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 30000 : 60000,
        maximumAge: 0
      };

      console.log('Запрашиваем геолокацию с параметрами:', options);

      if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handleGeolocationError,
        options
      );
    };

    const startWatchingPosition = () => {
      console.log('Начинаем отслеживание местоположения');
      
      // Сначала пробуем получить точное местоположение
      getCurrentPosition(true);

      // Затем начинаем отслеживание с менее строгими параметрами
      const id = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handleGeolocationError,
        {
          enableHighAccuracy: false,
          timeout: 60000,
          maximumAge: 1000
        }
      );

      setWatchId(id);
    };

    // Запускаем отслеживание местоположения
    startWatchingPosition();

    // Очистка при размонтировании
    return () => {
      if (watchId !== null) {
        console.log('Останавливаем отслеживание местоположения');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // Пустой массив зависимостей

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const email = localStorage.getItem('userEmail');
        if (!email) {
          throw new Error('Email пользователя не найден');
        }

        setIsLoading(true);
        
        // Параллельная загрузка данных пользователя и запросов
        const [userResponse, requestsResponse] = await Promise.all([
          axios.get('http://localhost:8080/api/users/current', {
            headers: { Authorization: `Bearer ${token}` },
            params: { email },
          }),
          axios.get('http://localhost:8080/api/requests/active', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        console.log('Current user:', userResponse.data);
        setCurrentUser(userResponse.data);
        setRequests(requestsResponse.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]); // Добавляем navigate в зависимости

  const handleRequestAdded = async () => {
    const token = localStorage.getItem('token');
    const requestsResponse = await axios.get('http://localhost:8080/api/requests/active', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setRequests(requestsResponse.data);
  };

  const handleUserUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      
      if (!token || !email) {
        navigate('/login');
        return;
      }

      const userResponse = await axios.get('http://localhost:8080/api/users/current', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          email: email,
        },
      });
      
      setCurrentUser(userResponse.data);
    } catch (error) {
      console.error('Ошибка обновления данных пользователя:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  };

  const sortedRequests = useMemo(() => {
    if (!userLocation) return requests;

    return [...requests].sort((a, b) => {
      const distanceA = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.latitude,
        a.longitude
      );
      const distanceB = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.latitude,
        b.longitude
      );
      return distanceA - distanceB;
    });
  }, [requests, userLocation]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="main-page">
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="menu-toggle-button">
          ☰
        </button>
      )}

      <Sidebar
        requests={sortedRequests.map(request => ({
          ...request,
          distance: userLocation ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            request.latitude,
            request.longitude
          ) : undefined
        }))}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
        onAddRequest={() => {}}
        onUserUpdate={handleUserUpdate}
      />

      <MapComponent 
        requests={requests}
        onRequestAdded={handleRequestAdded}
        userId={currentUser?.id || 0}
        userLocation={userLocation}
      />
    </div>
  );
};

export default MainPage;