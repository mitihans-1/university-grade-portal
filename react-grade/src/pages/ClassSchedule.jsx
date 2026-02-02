import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../context/LanguageContext';
import { Clock, MapPin, User, Calendar, Plus, Trash2, Filter, BookOpen, GraduationCap, X, ChevronRight } from 'lucide-react';

const ClassSchedule = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        department: (user.role === 'student' || user.role === 'teacher') ? user.department : '',
        year: user.role === 'student' ? user.year : '',
        semester: user.semester || '1'
    });

    // Admin Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        department: '',
        year: '1',
        semester: '1',
        courseCode: '',
        courseName: '',
        dayOfWeek: 'Monday',
        startTime: '08:30',
        endTime: '10:30',
        room: '',
        instructor: '',
        type: 'lecture'
    });

    const departments = [
        'Computer Science',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Medicine',
        'Business Administration',
        'Law',
        'Agriculture'
    ];

    useEffect(() => {
        fetchSchedules();
    }, [filters]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const data = await api.getSchedules(filters);
            setSchedules(data || []);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.addScheduleItem(newItem);
            showToast('Schedule item added', 'success');
            setIsAdding(false);
            fetchSchedules();
        } catch (error) {
            showToast('Failed to add schedule', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this schedule item?')) return;
        try {
            await api.deleteScheduleItem(id);
            showToast('Item removed', 'success');
            fetchSchedules();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const getTypeStyle = (type) => {
        switch (type) {
            case 'lab': return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
            case 'exam': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            case 'deadline': return { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
            default: return { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe' };
        }
    };

    if (loading && !schedules.length) return <LoadingSpinner fullScreen />;

    return (
        <div className="fade-in" style={{ maxWidth: '1300px', margin: '30px auto', padding: '0 20px' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '25px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Calendar size={28} /> {t('academicTimetable')}
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '1rem' }}>{t('timetableDescription')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            color: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                    >
                        <BookOpen size={18} /> {t('print')}
                    </button>
                    {user.permissions?.includes('manage_users') && (
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: isAdding ? '#f43f5e' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isAdding ? <X size={18} /> : <Plus size={18} />}
                            {isAdding ? t('cancel') : t('newSchedule')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Section */}
            <div className="card" style={{ marginBottom: '25px', padding: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>DEPARTMENT</label>
                    <select
                        value={filters.department}
                        onChange={e => setFilters({ ...filters, department: e.target.value })}
                        className="modern-input"
                        disabled={user.permissions?.includes('view_own_grades') && !user.permissions?.includes('view_child_grades')}
                    >
                        <option value="">{t('allDepartments')}</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div style={{ width: '120px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>YEAR</label>
                    <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} className="modern-input">
                        <option value="">{t('all')}</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t('year')} {y}</option>)}
                    </select>
                </div>
                <div style={{ width: '130px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>SEMESTER</label>
                    <select value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })} className="modern-input">
                        <option value="1">{t('semester')} 1</option>
                        <option value="2">{t('semester')} 2</option>
                    </select>
                </div>
                <button
                    onClick={fetchSchedules}
                    className="modern-btn"
                    style={{ width: 'auto', padding: '9px 15px', height: '38px', backgroundColor: '#64748b' }}
                >
                    <Filter size={16} /> {t('filter')}
                </button>
            </div>

            {/* Add Form (Admin) */}
            {isAdding && (
                <div className="card fade-in" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #3b82f6' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{t('addScheduleEntry')}</h3>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        <input required className="modern-input" placeholder="Course Name" value={newItem.courseName} onChange={e => setNewItem({ ...newItem, courseName: e.target.value })} />
                        <input required className="modern-input" placeholder="Course Code" value={newItem.courseCode} onChange={e => setNewItem({ ...newItem, courseCode: e.target.value })} />
                        <select className="modern-input" required value={newItem.department} onChange={e => setNewItem({ ...newItem, department: e.target.value })}>
                            <option value="">Select Dept</option>
                            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                        <select className="modern-input" required value={newItem.year} onChange={e => setNewItem({ ...newItem, year: e.target.value })}>
                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                        <select className="modern-input" required value={newItem.semester} onChange={e => setNewItem({ ...newItem, semester: e.target.value })}>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                        </select>
                        <select className="modern-input" value={newItem.dayOfWeek} onChange={e => setNewItem({ ...newItem, dayOfWeek: e.target.value })}>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="time" required className="modern-input" value={newItem.startTime} onChange={e => setNewItem({ ...newItem, startTime: e.target.value })} />
                        <input type="time" required className="modern-input" value={newItem.endTime} onChange={e => setNewItem({ ...newItem, endTime: e.target.value })} />
                        <input className="modern-input" placeholder="Room/Hall" value={newItem.room} onChange={e => setNewItem({ ...newItem, room: e.target.value })} />
                        <input className="modern-input" placeholder="Instructor" value={newItem.instructor} onChange={e => setNewItem({ ...newItem, instructor: e.target.value })} />
                        <select className="modern-input" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                            <option value="lecture">{t('lecture')}</option>
                            <option value="lab">{t('lab')}</option>
                            <option value="exam">{t('exam')}</option>
                            <option value="deadline">{t('deadline')}</option>
                        </select>
                        <button type="submit" className="modern-btn" style={{ fontWeight: '700' }}>{t('addEntry')}</button>
                    </form>
                </div>
            )}

            {/* Timetable View */}
            <div className="table-container fade-in" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <table style={{ background: 'white' }}>
                    <thead>
                        <tr>
                            <th style={{ backgroundColor: '#f8fafc', width: '120px' }}>DAY</th>
                            <th style={{ backgroundColor: '#f8fafc', width: '140px' }}>TIME</th>
                            <th style={{ backgroundColor: '#f8fafc' }}>COURSE</th>
                            <th style={{ backgroundColor: '#f8fafc' }}>INSTRUCTOR</th>
                            <th style={{ backgroundColor: '#f8fafc' }}>ROOM</th>
                            <th style={{ backgroundColor: '#f8fafc', textAlign: 'center' }}>TYPE</th>
                            {user.permissions?.includes('manage_users') && <th style={{ backgroundColor: '#f8fafc', textAlign: 'right' }}>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => {
                            const dayClasses = schedules.filter(s => s.dayOfWeek === day);
                            if (dayClasses.length === 0) return null;

                            return dayClasses.map((item, index) => {
                                const typeStyle = getTypeStyle(item.type);
                                return (
                                    <tr key={item.id} className="table-row-animate" style={{ transition: 'all 0.2s' }}>
                                        {index === 0 ? (
                                            <td rowSpan={dayClasses.length} style={{
                                                verticalAlign: 'top',
                                                fontWeight: '800',
                                                color: '#1e293b',
                                                borderRight: '1px solid #f1f5f9',
                                                backgroundColor: '#fff'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day ? '#3b82f6' : '#1e293b'
                                                }}>
                                                    <ChevronRight size={16} /> {day.toUpperCase()}
                                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            backgroundColor: '#dbeafe',
                                                            color: '#3b82f6',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            marginLeft: '5px'
                                                        }}>{t('today').toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </td>
                                        ) : null}
                                        <td style={{ fontWeight: '600', color: '#475569' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} style={{ opacity: 0.5 }} />
                                                {item.startTime} - {item.endTime}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                                {item.courseName} ({item.courseCode})
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <User size={14} style={{ color: '#10b981' }} />
                                                {item.instructor || 'Staff'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <MapPin size={14} style={{ color: '#ef4444' }} />
                                                {item.room || 'TBA'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                backgroundColor: typeStyle.bg,
                                                color: typeStyle.color,
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                border: `1px solid ${typeStyle.border}`,
                                                textTransform: 'uppercase'
                                            }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        {user.permissions?.includes('manage_users') && (
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>

                {schedules.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', color: '#94a3b8' }}>
                        <BookOpen size={40} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                        <h3 style={{ marginBottom: '5px' }}>{t('noSchedulesAvailable')}</h3>
                        <p>{t('noClassesFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassSchedule;
