import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';
import { Settings, User, Lock, Camera, Save, Mail, Phone, Calendar, Hash, ShieldCheck, ChevronRight } from 'lucide-react';
import '../premium-pages.css';

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
        showToast(t('imageTooLarge'), 'error');
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
    showToast(t('profilePictureUpdated'), 'success');
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
      const updatedUser = await api.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        year: formData.year,
        semester: formData.semester
      });

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
    <div className="premium-page-container fade-in">
      <div className="premium-glass-card" style={{ maxWidth: '900px' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="premium-title">{t('settings')}</h1>
          <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
            <span style={{ fontSize: '1rem', fontWeight: '700', opacity: 0.9 }}>SYSTEM PREFERENCES</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,198,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
              {user?.name}
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ fontWeight: '500', opacity: 0.9, letterSpacing: '1px' }}>ID: {user?.studentId || user?.id}</span>
          </div>
        </header>

        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          padding: '5px',
          borderRadius: '15px',
          marginBottom: '40px',
          gap: '5px'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'profile' ? 'linear-gradient(45deg, #00c9ff, #92fe9d)' : 'transparent',
              color: activeTab === 'profile' ? '#0f172a' : 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '900',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <User size={18} /> {t('profile')}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'password' ? 'linear-gradient(45deg, #00c9ff, #92fe9d)' : 'transparent',
              color: activeTab === 'password' ? '#0f172a' : 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '900',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Lock size={18} /> {t('security')}
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="fade-in">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '50px',
              position: 'relative'
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #00c9ff, #92fe9d)',
                  padding: '4px',
                  boxShadow: '0 0 30px rgba(0,201,255,0.3)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '4px solid #0f172a'
                  }}>
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={70} color="rgba(255,255,255,0.1)" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0f172a',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover-scale"
                >
                  <Camera size={20} />
                </button>
              </div>
              <p style={{ marginTop: '20px', fontSize: '0.85rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px' }}>
                Identity Profile
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
              />
            </div>

            <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              <div className="input-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  <User size={14} /> Full Legal Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.name ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.name && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.name}</small>}
              </div>

              <div className="input-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  <Mail size={14} /> Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.email ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.email && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.email}</small>}
              </div>

              <div className="input-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  <Phone size={14} /> Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.phone ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.phone && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.phone}</small>}
              </div>

              {user?.role === 'student' && (
                <>
                  <div className="input-field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                      <Calendar size={14} /> Academic Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="premium-input"
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: 'white', appearance: 'none' }}
                    >
                      {[1, 2, 3, 4, 5].map(y => (
                        <option key={y} value={y} style={{ background: '#0f172a' }}>{t(`year${y}`) || `Year ${y}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                      <Hash size={14} /> Current Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="premium-input"
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: 'white', appearance: 'none' }}
                    >
                      <option value="1" style={{ background: '#0f172a' }}>Semester 1</option>
                      <option value="2" style={{ background: '#0f172a' }}>Semester 2</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="premium-btn"
                  style={{ width: '100%', padding: '18px', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none', fontWeight: '900', fontSize: '1rem' }}
                >
                  {loading ? 'SYNCHRONIZING...' : 'UPDATE PROFILE IDENTITY'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <ShieldCheck size={50} color="#00c9ff" style={{ marginBottom: '20px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Credential Security</h3>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Maintain your account access by updating your security phrase regularly.</p>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  Current Access Phrase
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.currentPassword ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.currentPassword && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.currentPassword}</small>}
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  New Security Phrase
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.newPassword ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.newPassword && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.newPassword}</small>}
              </div>

              <div style={{ marginBottom: '40px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>
                  Confirm Access Phrase
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${errors.confirmPassword ? '#ff4b2b' : 'rgba(255,255,255,0.1)'}`, padding: '15px', borderRadius: '15px', color: 'white' }}
                />
                {errors.confirmPassword && <small style={{ color: '#ff4b2b', display: 'block', marginTop: '5px' }}>{errors.confirmPassword}</small>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="premium-btn"
                style={{ width: '100%', padding: '18px', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none', fontWeight: '900', fontSize: '1rem' }}
              >
                {loading ? 'VERIFYING...' : 'UPGRADE SECURITY PHRASE'}
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
    </div>
  );
};

export default SettingsPage;
