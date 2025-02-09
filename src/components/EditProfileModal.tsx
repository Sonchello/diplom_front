import React, { useState } from 'react';
import axios from 'axios';
import './EditProfileModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';

interface EditProfileModalProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string;
    birthDate?: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (newPassword && newPassword !== confirmPassword) {
        alert('Новые пароли не совпадают');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (birthDate) {
        formData.append('birthDate', birthDate);
      }
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }
      if (currentPassword && newPassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      await axios.put(
        `http://localhost:8080/api/users/${user.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      onUpdate();
      onClose();
      alert('Профиль успешно обновлен!');
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      alert('Ошибка при обновлении профиля');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="edit-profile-modal">
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h2>Редактировать профиль</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="avatar-section">
            <img 
              src={previewUrl || '/default-avatar.png'} 
              alt="Avatar" 
              className="avatar-preview"
            />
            <div className="avatar-upload">
              <label className="upload-button">
                <FontAwesomeIcon icon={faUpload} />
                Загрузить фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Дата рождения:</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <button 
            type="button" 
            className="change-password-button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            {showPasswordFields ? 'Скрыть смену пароля' : 'Сменить пароль'}
          </button>

          {showPasswordFields && (
            <>
              <div className="form-group">
                <label>Текущий пароль:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Новый пароль:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Подтвердите новый пароль:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-buttons">
            <button type="submit" className="save-button">
              Сохранить
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 