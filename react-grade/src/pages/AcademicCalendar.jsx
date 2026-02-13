import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { Plus, Calendar as CalendarIcon, Info, X, Clock, MapPin, Layout, Globe, Star } from 'lucide-react';
import '../premium-pages.css';

const localizer = momentLocalizer(moment);

const AcademicCalendar = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        type: 'academic'
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await api.getEvents();
            const formattedEvents = data.map(evt => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end)
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            if (!newEvent.title || !newEvent.start || !newEvent.end) {
                showToast(t('pleaseFillRequiredFields'), 'error');
                return;
            }
            await api.createEvent(newEvent);
            showToast(t('eventCreatedSuccess'), 'success');
            setShowModal(false);
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            showToast(t('failedToCreateEvent'), 'error');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm(t('confirmDeleteEvent'))) return;
        try {
            await api.deleteEvent(id);
            showToast(t('eventDeleted'), 'success');
            fetchEvents();
        } catch (error) {
            showToast(t('failedToDeleteEvent'), 'error');
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = 'rgba(0, 201, 255, 0.2)';
        let borderColor = 'rgba(0, 201, 255, 0.4)';
        switch (event.type) {
            case 'exam':
                backgroundColor = 'rgba(239, 68, 68, 0.2)';
                borderColor = 'rgba(239, 68, 68, 0.4)';
                break;
            case 'holiday':
                backgroundColor = 'rgba(146, 254, 157, 0.2)';
                borderColor = 'rgba(146, 254, 157, 0.4)';
                break;
            case 'deadline':
                backgroundColor = 'rgba(251, 146, 60, 0.2)';
                borderColor = 'rgba(251, 146, 60, 0.4)';
                break;
            case 'activity':
                backgroundColor = 'rgba(139, 92, 246, 0.2)';
                borderColor = 'rgba(139, 92, 246, 0.4)';
                break;
            default:
                backgroundColor = 'rgba(0, 201, 255, 0.2)';
                borderColor = 'rgba(0, 201, 255, 0.4)';
        }
        return {
            style: {
                backgroundColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                color: 'white',
                display: 'block',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '2px 8px'
            }
        };
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="premium-page-container fade-in">
            <div className="premium-glass-card" style={{ maxWidth: '1200px' }}>
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="premium-title">{t('academicCalendar')}</h1>
                    <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', opacity: 0.9 }}>UNIVERSITY HUB</span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,198,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {new Date().getFullYear()}
                        </span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontWeight: '500', opacity: 0.9, letterSpacing: '1px' }}>ACADEMIC CYCLE</span>
                    </div>

                    {user && user.permissions?.includes('manage_system') && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="premium-btn hover-scale"
                            style={{ margin: '30px auto 0', maxWidth: '200px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <Plus size={20} /> {t('addEvent')}
                        </button>
                    )}
                </header>

                <div style={{ height: '800px', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }} className="calendar-container">
                    <style>{`
                        .rbc-calendar { font-family: inherit; color: white; }
                        .rbc-header { padding: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1) !important; color: #00c9ff; }
                        .rbc-month-view { border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 20px; overflow: hidden; background: rgba(15, 23, 42, 0.4); }
                        .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05) !important; }
                        .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.05) !important; }
                        .rbc-off-range-bg { background: rgba(0,0,0,0.2); }
                        .rbc-today { background: rgba(0, 201, 255, 0.05) !important; }
                        .rbc-toolbar { margin-bottom: 25px !important; }
                        .rbc-toolbar button { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; border-radius: 10px !important; padding: 8px 15px !important; font-weight: 700 !important; transition: all 0.3s ease !important; }
                        .rbc-toolbar button:hover { background: rgba(0, 201, 255, 0.2) !important; border-color: #00c9ff !important; }
                        .rbc-toolbar button.rbc-active { background: linear-gradient(45deg, #00c9ff, #92fe9d) !important; color: #0f172a !important; border: none !important; }
                        .rbc-toolbar-label { font-weight: 900 !important; fontSize: 1.2rem !important; }
                    `}</style>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => {
                            if (user.permissions?.includes('manage_system')) handleDeleteEvent(event.id);
                            else showToast(`${event.title}: ${event.description || ''}`, 'info');
                        }}
                    />
                </div>

                {/* Add Event Modal */}
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="premium-glass-card fade-in" style={{ width: '600px', margin: '0', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Create Event</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={30} /></button>
                            </div>

                            <div className="input-field" style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase' }}>{t('title')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Star size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#00c9ff' }} />
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="premium-input"
                                        style={{ width: '100%', paddingLeft: '45px' }}
                                        placeholder="Enter event title..."
                                    />
                                </div>
                            </div>

                            <div className="input-field" style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase' }}>{t('type')}</label>
                                <select
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                    className="premium-input"
                                    style={{ width: '100%', appearance: 'none', background: 'rgba(15, 23, 42, 0.5)' }}
                                >
                                    <option value="academic" style={{ background: '#0f172a' }}>{t('academic')}</option>
                                    <option value="exam" style={{ background: '#0f172a' }}>{t('exam')}</option>
                                    <option value="holiday" style={{ background: '#0f172a' }}>{t('holiday')}</option>
                                    <option value="deadline" style={{ background: '#0f172a' }}>{t('deadline')}</option>
                                    <option value="activity" style={{ background: '#0f172a' }}>{t('activity')}</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                <div className="input-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase' }}>{t('startDate')}</label>
                                    <input
                                        type="datetime-local"
                                        value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                                        onChange={e => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                                        className="premium-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div className="input-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase' }}>{t('endDate')}</label>
                                    <input
                                        type="datetime-local"
                                        value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                                        onChange={e => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                                        className="premium-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="input-field" style={{ marginBottom: '35px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px', textTransform: 'uppercase' }}>{t('description')}</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="premium-input"
                                    style={{ width: '100%', height: '100px', resize: 'none' }}
                                    placeholder="Provide detailed information..."
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="premium-btn"
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleCreateEvent}
                                    className="premium-btn"
                                    style={{ flex: 2, background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none' }}
                                >
                                    {t('saveEvent')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademicCalendar;
