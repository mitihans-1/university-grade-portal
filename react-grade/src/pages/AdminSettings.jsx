import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../context/LanguageContext';
import { Settings, Save, AlertTriangle, Calendar, BookOpen, ToggleLeft, ToggleRight, Database, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../admin-dashboard.css';

const AdminSettings = () => {
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState([]);
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await api.getSettings();
            setSettings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        setSaving(key);
        try {
            await api.updateSetting(key, value);
            // Update local state
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: String(value) } : s));
            showToast('Setting updated successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to update setting', 'error');
        } finally {
            setSaving(null);
        }
    };

    // Helper to get value of a specific setting key
    const getVal = (key) => {
        const setting = settings.find(s => s.key === key);
        return setting ? setting.value : '';
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="admin-dashboard-container fade-in">
            <div className="admin-card" style={{ maxWidth: '1000px', margin: '20px auto' }}>
                <header className="admin-header">
                    <div className="admin-title" style={{ textAlign: 'center' }}>
                        System Configuration
                    </div>
                    <p className="admin-subtitle" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        Manage global academic settings, registration periods, and system switches
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Academic Period Section */}
                    <div className="admin-card" style={{ marginBottom: 0, height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0284c7' }}>
                                <Calendar size={24} />
                            </div>
                            <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Current Academic Period</h2>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Academic Year</label>
                            <select
                                value={getVal('current_year')}
                                onChange={(e) => handleUpdate('current_year', e.target.value)}
                                className="form-input"
                                disabled={saving === 'current_year'}
                            >
                                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>This sets the default year for new registrations.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Current Semester</label>
                            <select
                                value={getVal('current_semester')}
                                onChange={(e) => handleUpdate('current_semester', e.target.value)}
                                className="form-input"
                                disabled={saving === 'current_semester'}
                            >
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                            </select>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>Affects which courses are shown and grade submissions.</p>
                        </div>
                    </div>

                    {/* System Toggles Section */}
                    <div className="admin-card" style={{ marginBottom: 0, height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#d97706' }}>
                                <ToggleLeft size={24} />
                            </div>
                            <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Access Controls</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>Student Registration</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Allow new students to sign up</p>
                                </div>
                                <button
                                    onClick={() => handleUpdate('registration_open', getVal('registration_open') === 'true' ? 'false' : 'true')}
                                    disabled={saving === 'registration_open'}
                                    className={`status-badge ${getVal('registration_open') === 'true' ? 'present' : 'absent'}`}
                                    style={{ border: 'none', cursor: 'pointer', fontSize: '14px', padding: '8px 16px' }}
                                >
                                    {getVal('registration_open') === 'true' ? 'OPEN' : 'CLOSED'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>Grade Submission</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Allow teachers to submit grades</p>
                                </div>
                                <button
                                    onClick={() => handleUpdate('grade_submission_open', getVal('grade_submission_open') === 'true' ? 'false' : 'true')}
                                    disabled={saving === 'grade_submission_open'}
                                    className={`status-badge ${getVal('grade_submission_open') === 'true' ? 'present' : 'absent'}`}
                                    style={{ border: 'none', cursor: 'pointer', fontSize: '14px', padding: '8px 16px' }}
                                >
                                    {getVal('grade_submission_open') === 'true' ? 'OPEN' : 'CLOSED'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Academic Data Management */}
                <div className="admin-card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#e0e7ff', borderRadius: '8px', color: '#4338ca' }}>
                            <Database size={24} />
                        </div>
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Academic Catalogs</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        <ListManager
                            title="Departments"
                            settingKey="departments"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'departments'}
                        />

                        <ListManager
                            title="Semesters"
                            settingKey="semesters"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'semesters'}
                        />

                        <ListManager
                            title="Academic Years"
                            settingKey="academic_years"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'academic_years'}
                        />

                        <CourseManager
                            title="Course Catalog"
                            settingKey="courses"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'courses'}
                        />
                    </div>
                </div>

                {/* Danger Zone Section */}
                <div className="admin-card" style={{ marginTop: '20px', backgroundColor: '#fff1f2', border: '1px solid #fda4af' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <AlertTriangle size={24} color="#be123c" />
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#881337' }}>Danger Zone</h2>
                    </div>
                    <p style={{ color: '#be123c', marginBottom: '15px', fontSize: '14px' }}>
                        Advanced actions for system maintenance. Please proceed with caution.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="admin-btn" style={{ backgroundColor: '#be123c', color: 'white', opacity: 0.8, cursor: 'not-allowed' }} disabled>Archive Old Data (Coming Soon)</button>
                        <button className="admin-btn" style={{ backgroundColor: '#be123c', color: 'white', opacity: 0.8, cursor: 'not-allowed' }} disabled>Reset All Passwords (Coming Soon)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Simple Lists
const ListManager = ({ title, settingKey, getVal, onUpdate, saving }) => {
    const [newItem, setNewItem] = useState('');
    const list = React.useMemo(() => {
        try {
            const val = getVal(settingKey);
            return val ? JSON.parse(val) : [];
        } catch (e) { return []; }
    }, [getVal, settingKey]);

    const handleAdd = () => {
        if (!newItem.trim()) return;
        const newList = [...list, newItem.trim()];
        onUpdate(settingKey, JSON.stringify(newList));
        setNewItem('');
    };

    const handleRemove = (item) => {
        const newList = list.filter(i => i !== item);
        onUpdate(settingKey, JSON.stringify(newList));
    };

    return (
        <div>
            <h3 style={{ fontSize: '15px', color: '#475569', marginBottom: '12px', fontWeight: 'bold' }}>{title}</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`Add new...`}
                    className="form-input"
                    style={{ flex: 1, padding: '8px 12px' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !newItem.trim()}
                    className="admin-btn"
                    style={{ padding: '8px 12px' }}
                >
                    <Plus size={16} />
                </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {list.length > 0 ? list.map((item, idx) => (
                    <div key={idx} style={{ padding: '5px 12px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {item}
                        <button onClick={() => handleRemove(item)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><XCircle size={14} /></button>
                    </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No items added yet.</p>}
            </div>
        </div>
    );
};

// Helper Component for Courses
const CourseManager = ({ title, settingKey, getVal, onUpdate, saving }) => {
    const [newItem, setNewItem] = useState({ code: '', name: '' });
    const list = React.useMemo(() => {
        try {
            const val = getVal(settingKey);
            return val ? JSON.parse(val) : [];
        } catch (e) { return []; }
    }, [getVal, settingKey]);

    const handleAdd = () => {
        if (!newItem.code.trim() || !newItem.name.trim()) return;
        const newList = [...list, newItem];
        onUpdate(settingKey, JSON.stringify(newList));
        setNewItem({ code: '', name: '' });
    };

    const handleRemove = (code) => {
        const newList = list.filter(i => i.code !== code);
        onUpdate(settingKey, JSON.stringify(newList));
    };

    return (
        <div>
            <h3 style={{ fontSize: '15px', color: '#475569', marginBottom: '12px', fontWeight: 'bold' }}>{title}</h3>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                    placeholder="Course Code (e.g. CS101)"
                    className="form-input"
                    style={{ padding: '8px 12px' }}
                />
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Subject Name"
                    className="form-input"
                    style={{ padding: '8px 12px' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !newItem.code.trim() || !newItem.name.trim()}
                    className="admin-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                >
                    <Plus size={16} /> Add Course
                </button>
            </div>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {list.length > 0 ? list.map((item, idx) => (
                    <div key={idx} style={{ padding: '10px 15px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#1e293b', marginRight: '8px' }}>{item.code}</span>
                            <span style={{ color: '#64748b' }}>{item.name}</span>
                        </div>
                        <button onClick={() => handleRemove(item.code)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                    </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No courses in catalog.</p>}
            </div>
        </div>
    );
};

export default AdminSettings;
