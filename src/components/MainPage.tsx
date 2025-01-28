import React, { useEffect, useState } from 'react';
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
  category: string;
  urgency?: 'low' | 'medium' | 'high';
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
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

        const userResponse = await axios.get('http://localhost:8080/api/users/current', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            email: email,
          },
        });
        
        console.log('Current user:', userResponse.data);
        setCurrentUser(userResponse.data);

        const requestsResponse = await axios.get('http://localhost:8080/api/requests/active', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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

    fetchData();
  }, [navigate]);

  const handleRequestAdded = async () => {
    const token = localStorage.getItem('token');
    const requestsResponse = await axios.get('http://localhost:8080/api/requests/active', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setRequests(requestsResponse.data);
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="main-page">
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="menu-toggle-button">
          ☰
        </button>
      )}

      <Sidebar
        requests={requests}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
        onAddRequest={() => {}}
      />

      <MapComponent 
        requests={requests}
        onRequestAdded={handleRequestAdded}
        userId={currentUser?.id || 0}
      />
    </div>
  );
};

export default MainPage;