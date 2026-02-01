import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';
import { api } from '../utils/api';
import { UserPlus, Shield, Mail, Lock, Building, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAddAdmin = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: 'General Administration'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            showToast(t('passwordsDoNotMatch'), 'error');
            return;
        }

        setLoading(true);
        try {
            const adminData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                department: formData.department
            };

            const response = await api.registerAdmin(adminData);
            showToast(t('adminAddedSuccess'), 'success');

            // Clear form
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                department: 'General Administration'
            });

            // Navigate back after short delay
            setTimeout(() => {
                navigate('/admin');
            }, 2000);

        } catch (error) {
            showToast(t('failedToAddAdmin'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1e293b'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
            >
                <ArrowLeft size={16} /> {t('back')}
            </button>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.02)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '20px',
                        backgroundColor: '#eff6ff',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.1)'
                    }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                        {t('addNewAdministrator')}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '15px' }}>
                        {t('grantAdminAccess')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>{t('fullName')}</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <UserPlus size={18} />
                            </span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('fullNamePlaceholder')}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>{t('email')}</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Mail size={18} />
                            </span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. admin@university.edu"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>{t('department')}</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Building size={18} />
                            </span>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '15px',
                                    outline: 'none',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="General Administration">{t('generalAdministration')}</option>
                                <option value="IT Department">{t('itDepartment')}</option>
                                <option value="Academic Registry">{t('academicRegistry')}</option>
                                <option value="Finance Office">{t('financeOffice')}</option>
                                <option value="Student Affairs">{t('studentAffairs')}</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>{t('password')}</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px 14px 48px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #e2e8f0',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>{t('confirm')}</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px 14px 48px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #e2e8f0',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            padding: '16px',
                            borderRadius: '14px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                            }
                        }}
                    >
                        {loading ? t('addingAdministrator') : t('createAdminAccount')}
                    </button>
                </form>

                <div style={{
                    marginTop: '25px',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#fff9eb',
                    border: '1px solid #feebc8',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                }}>
                    <div style={{ color: '#d97706', marginTop: '2px' }}>⚠️</div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                        <strong>{t('securityNote')}:</strong> {t('adminSecurityWarning')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminAddAdmin;
