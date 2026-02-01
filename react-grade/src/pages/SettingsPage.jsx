import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProfileImageEditor from '../components/common/ProfileImageEditor';
import { Camera, User } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    year: user?.year || '',
    semester: user?.semester || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [editingImage, setEditingImage] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image is too large. Please select an image smaller than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = (croppedImage) => {
    updateUser({ profileImage: croppedImage });
    setEditingImage(null);
    showToast('Profile picture updated!', 'success');
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = t('fullNameRequired');
    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('validEmailRequired');
    }
    if (!formData.phone) newErrors.phone = t('phoneRequired');
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = t('currentPasswordRequired');
    if (formData.newPassword.length < 6) newErrors.newPassword = t('passwordLengthRequired');
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }
    return newErrors;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Call API to update profile
      const updatedUser = await api.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        year: formData.year,
        semester: formData.semester
      });

      // Update local context
      updateUser(updatedUser);
      showToast(t('profileUpdatedSuccessfully'), 'success');
      setErrors({});
    } catch (error) {
      showToast(t('errorUpdatingProfile'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd call an API endpoint to change password
      showToast(t('passwordChangedSuccessfully'), 'success');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      showToast(t('errorChangingPassword'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '30px' }}>{t('settings')}</h2>

      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        borderBottom: '2px solid #eee'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'profile' ? '2px solid #1976d2' : '2px solid transparent',
            color: activeTab === 'profile' ? '#1976d2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal'
          }}
        >
          {t('profile')}
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'password' ? '2px solid #1976d2' : '2px solid transparent',
            color: activeTab === 'password' ? '#1976d2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'password' ? 'bold' : 'normal'
          }}
        >
          {t('changePassword')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>{t('updateProfile')}</h3>

          {/* Profile Image Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #3b82f6',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={50} color="#cbd5e1" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                title="Change Profile Photo"
              >
                <Camera size={16} />
              </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Profile Photo
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('fullName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.name ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.name && <small style={{ color: '#f44336' }}>{errors.name}</small>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('email')} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.email ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.email && <small style={{ color: '#f44336' }}>{errors.email}</small>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('phone')} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.phone ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.phone && <small style={{ color: '#f44336' }}>{errors.phone}</small>}
            </div>

            {user?.role === 'student' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    {t('year')}
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  >
                    {[1, 2, 3, 4, 5].map(y => (
                      <option key={y} value={y}>{t(`year${y}`) || `Year ${y}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    {t('semester')}
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 30px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? <LoadingSpinner size={20} /> : t('saveChanges')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>{t('changePassword')}</h3>
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('currentPassword')} *
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.currentPassword ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.currentPassword && <small style={{ color: '#f44336' }}>{errors.currentPassword}</small>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('newPassword')} *
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.newPassword ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.newPassword && <small style={{ color: '#f44336' }}>{errors.newPassword}</small>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                {t('confirmPassword')} *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${errors.confirmPassword ? '#f44336' : '#ddd'}`,
                  borderRadius: '5px'
                }}
              />
              {errors.confirmPassword && <small style={{ color: '#f44336' }}>{errors.confirmPassword}</small>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 30px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? <LoadingSpinner size={20} /> : t('changePassword')}
            </button>
          </form>
        </div>
      )}

      {editingImage && (
        <ProfileImageEditor
          image={editingImage}
          onSave={handleSaveImage}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
};

export default SettingsPage;

