import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../context/LanguageContext';
import { Settings, Save, AlertTriangle, Calendar, BookOpen, ToggleLeft, ToggleRight, Database } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
        <div className="fade-in" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
                <Settings size={32} color="#1a237e" />
                <div>
                    <h1 style={{ margin: 0, color: '#1a237e', fontSize: '28px' }}>System Configuration</h1>
                    <p style={{ margin: '5px 0 0', color: '#64748b' }}>Manage global academic settings, registration periods, and system switches.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>

                {/* Academic Period Section */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
                            <Calendar size={24} color="#0284c7" />
                        </div>
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Current Academic Period</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Academic Year</label>
                            <select
                                value={getVal('current_year')}
                                onChange={(e) => handleUpdate('current_year', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                disabled={saving === 'current_year'}
                            >
                                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '5px' }}>This sets the default year for new registrations.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>Current Semester</label>
                            <select
                                value={getVal('current_semester')}
                                onChange={(e) => handleUpdate('current_semester', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                disabled={saving === 'current_semester'}
                            >
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                            </select>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '5px' }}>Affects which courses are shown and grade submissions.</p>
                        </div>
                    </div>
                </div>

                {/* System Toggles Section */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                            <ToggleLeft size={24} color="#d97706" /> {/* Using generic toggle icon representation */}
                        </div>
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Access Controls</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>Student Registration</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Allow new students to sign up</p>
                            </div>
                            <button
                                onClick={() => handleUpdate('registration_open', getVal('registration_open') === 'true' ? 'false' : 'true')}
                                disabled={saving === 'registration_open'}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    backgroundColor: getVal('registration_open') === 'true' ? '#dcfce7' : '#fee2e2',
                                    color: getVal('registration_open') === 'true' ? '#166534' : '#991b1b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {getVal('registration_open') === 'true' ? 'OPEN' : 'CLOSED'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>Grade Submission</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Allow teachers to submit grades</p>
                            </div>
                            <button
                                onClick={() => handleUpdate('grade_submission_open', getVal('grade_submission_open') === 'true' ? 'false' : 'true')}
                                disabled={saving === 'grade_submission_open'}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    backgroundColor: getVal('grade_submission_open') === 'true' ? '#dcfce7' : '#fee2e2',
                                    color: getVal('grade_submission_open') === 'true' ? '#166534' : '#991b1b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {getVal('grade_submission_open') === 'true' ? 'OPEN' : 'CLOSED'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Academic Data Management */}
                <div style={{ gridColumn: '1 / -1', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#e0e7ff', borderRadius: '8px' }}>
                            <Database size={24} color="#4338ca" />
                        </div>
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Academic Catalogs</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        {/* Departments */}
                        <ListManager
                            title="Departments"
                            settingKey="departments"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'departments'}
                        />

                        {/* Semesters */}
                        <ListManager
                            title="Semesters"
                            settingKey="semesters"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'semesters'}
                        />

                        {/* Academic Years */}
                        <ListManager
                            title="Academic Years"
                            settingKey="academic_years"
                            getVal={getVal}
                            onUpdate={handleUpdate}
                            saving={saving === 'academic_years'}
                        />

                        {/* Courses */}
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
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff1f2', borderRadius: '12px', padding: '25px', border: '1px solid #fda4af' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <AlertTriangle size={24} color="#be123c" />
                        <h2 style={{ fontSize: '18px', margin: 0, color: '#881337' }}>Danger Zone</h2>
                    </div>
                    <p style={{ color: '#be123c', marginBottom: '15px' }}>
                        Advanced actions for system maintenance. Please proceed with caution.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button style={{ backgroundColor: '#be123c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', opacity: 0.8 }} disabled>Archive Old Data (Coming Soon)</button>
                        <button style={{ backgroundColor: '#be123c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', opacity: 0.8 }} disabled>Reset All Passwords (Coming Soon)</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper Component for Simple Lists (Departments, Semesters, Years)
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
                    placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !newItem.trim()}
                    style={{ padding: '8px 16px', backgroundColor: '#4338ca', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                >
                    Add
                </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {list.length > 0 ? list.map((item, idx) => (
                    <div key={idx} style={{ padding: '5px 12px', backgroundColor: '#f1f5f9', borderRadius: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                        {item}
                        <button onClick={() => handleRemove(item)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                    </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No items added yet.</p>}
            </div>
        </div>
    );
};

// Helper Component for Courses (Code + Name)
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
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Subject Name"
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !newItem.code.trim() || !newItem.name.trim()}
                    style={{ padding: '8px 16px', backgroundColor: '#4338ca', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                >
                    Add Course to Catalog
                </button>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
                {list.length > 0 ? list.map((item, idx) => (
                    <div key={idx} style={{ padding: '10px 15px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#1e293b', marginRight: '8px' }}>{item.code}</span>
                            <span style={{ color: '#64748b' }}>{item.name}</span>
                        </div>
                        <button onClick={() => handleRemove(item.code)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                    </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No courses in catalog.</p>}
            </div>
        </div>
    );
};

export default AdminSettings;
