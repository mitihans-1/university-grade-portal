import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const localizer = momentLocalizer(moment);

const AcademicCalendar = () => {
    const { user } = useAuth();
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
            // Convert strings to Date objects
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
                showToast('Please fill in required fields', 'error');
                return;
            }
            await api.createEvent(newEvent);
            showToast('Event created successfully', 'success');
            setShowModal(false);
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            showToast('Failed to create event', 'error');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.deleteEvent(id);
            showToast('Event deleted', 'success');
            fetchEvents();
        } catch (error) {
            showToast('Failed to delete event', 'error');
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        switch (event.type) {
            case 'exam': backgroundColor = '#dc3545'; break; // Red
            case 'holiday': backgroundColor = '#28a745'; break; // Green
            case 'deadline': backgroundColor = '#ffc107'; break; // Yellow/Orange
            case 'activity': backgroundColor = '#17a2b8'; break; // Teal
            default: backgroundColor = '#007bff'; // Blue
        }
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0' }}>📅 Academic Calendar</h1>
                    <p style={{ color: '#666' }}>Important dates, exams, and holidays.</p>
                </div>
                {user && user.permissions?.includes('manage_system') && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add Event
                    </button>
                )}
            </div>

            <div style={{ height: '700px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
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
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <h2>Add New Event</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                            <input
                                type="text"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
                            <select
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            >
                                <option value="academic">Academic</option>
                                <option value="exam">Exam</option>
                                <option value="holiday">Holiday</option>
                                <option value="deadline">Deadline</option>
                                <option value="activity">Activity</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
                                <input
                                    type="datetime-local"
                                    value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                                    onChange={e => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
                                <input
                                    type="datetime-local"
                                    value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                                    onChange={e => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                            <textarea
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                style={{ width: '100%', padding: '10px', height: '80px', borderRadius: '5px', border: '1px solid #ddd' }}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Save Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicCalendar;
