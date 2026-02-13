import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { X, Upload, Plus, Search, Filter } from 'lucide-react';
import '../admin-dashboard.css';

const AdminIdManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
    const [studentIDs, setStudentIDs] = useState([]);
    const [teacherIDs, setTeacherIDs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [systemSettings, setSystemSettings] = useState(null);

    // Form States
    const [studentForm, setStudentForm] = useState({
        studentId: '',
        department: '',
        year: '1',
        semester: '1',
        nationalId: ''
    });
    const [teacherForm, setTeacherForm] = useState({
        teacherId: '',
        department: '',
        subject: '',
        semester: '',
        year: '',
        specialization: '',
        nationalId: ''
    });

    const [filterYear, setFilterYear] = useState('All');
    const [filterSemester, setFilterSemester] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchIDs();
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const data = await api.getPublicSettings();
            setSystemSettings(data);
        } catch (e) { console.error(e); }
    };

    const fetchIDs = async () => {
        setLoading(true);
        fetchSettings();
        try {
            if (activeTab === 'student') {
                const data = await api.getStudentIDs();
                setStudentIDs(Array.isArray(data) ? data : []);
            } else {
                const data = await api.getTeacherIDs();
                setTeacherIDs(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch IDs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        if (activeTab === 'student') {
            setStudentForm({
                studentId: item.studentId,
                department: item.department || '',
                year: item.year || '1',
                semester: item.semester || '1',
                nationalId: item.nationalId || ''
            });
        } else {
            setTeacherForm({
                teacherId: item.teacherId,
                department: item.department || '',
                subject: item.subject || '',
                semester: item.semester || '',
                year: item.year || '',
                specialization: item.specialization || '',
                nationalId: item.nationalId || ''
            });
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ID?')) return;
        try {
            if (activeTab === 'student') {
                await api.deleteStudentID(id);
            } else {
                await api.deleteTeacherID(id);
            }
            fetchIDs();
            showToast('ID deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete ID', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Client-side Duplicate Check (only if adding new or changing ID)
            if (activeTab === 'student') {
                const standardizedId = studentForm.studentId.trim().toLowerCase();
                const isDuplicate = studentIDs.some(s => s.studentId.trim().toLowerCase() === standardizedId && s.id !== editingId);

                if (isDuplicate) {
                    showToast('Error: This Student ID is already in the list.', 'error');
                    return;
                }

                let result;
                if (editingId) {
                    result = await api.updateStudentID(editingId, studentForm);
                } else {
                    result = await api.addStudentID(studentForm);
                }

                if (result && !result.msg) {
                    showToast(`Student ID ${editingId ? 'updated' : 'added'} successfully`, 'success');
                    setShowModal(false);
                    setEditingId(null);
                    setStudentForm({ studentId: '', department: '', year: '1', semester: '1', nationalId: '' });
                    fetchIDs();
                } else {
                    showToast(result.msg || `Failed to ${editingId ? 'update' : 'add'} Student ID`, 'error');
                }
            } else {
                const standardizedId = teacherForm.teacherId.trim().toLowerCase();
                const isDuplicate = teacherIDs.some(t => t.teacherId.trim().toLowerCase() === standardizedId && t.id !== editingId);

                if (isDuplicate) {
                    showToast('Error: This Teacher ID is already in the list.', 'error');
                    return;
                }

                let result;
                if (editingId) {
                    result = await api.updateTeacherID(editingId, teacherForm);
                } else {
                    result = await api.addTeacherID(teacherForm);
                }

                if (result && !result.msg) {
                    showToast(`Teacher ID ${editingId ? 'updated' : 'added'} successfully`, 'success');
                    setShowModal(false);
                    setEditingId(null);
                    setTeacherForm({ teacherId: '', department: '', subject: '', semester: '', year: '', specialization: '', nationalId: '' });
                    fetchIDs();
                } else {
                    showToast(result.msg || `Failed to ${editingId ? 'update' : 'add'} Teacher ID`, 'error');
                }
            }
        } catch (error) {
            console.error(error);
            showToast(`Error ${editingId ? 'updating' : 'adding'} ID`, 'error');
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setStudentForm({ studentId: '', department: '', year: '1', semester: '1', nationalId: '' });
        setTeacherForm({ teacherId: '', department: '', subject: '', semester: '', year: '', specialization: '', nationalId: '' });
        setShowModal(true);
    };

    if (loading && !showModal) return <LoadingSpinner fullScreen />;

    const getFilteredItems = () => {
        let items = activeTab === 'student' ? studentIDs : teacherIDs;

        if (filterYear !== 'All') {
            items = items.filter(item => String(item.year) === String(filterYear));
        }

        if (filterSemester !== 'All') {
            items = items.filter(item => String(item.semester) === String(filterSemester));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item =>
                (item.studentId && item.studentId.toLowerCase().includes(term)) ||
                (item.teacherId && item.teacherId.toLowerCase().includes(term)) ||
                (item.department && item.department.toLowerCase().includes(term))
            );
        }

        return items;
    };

    const filteredItems = getFilteredItems();

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            showToast('Please select a file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('type', activeTab);

        try {
            const result = await api.batchUploadIDs(formData);
            if (result.success) {
                showToast(result.msg, 'success');
                if (result.errors && result.errors.length > 0) {
                    console.warn('Upload warnings:', result.errors);
                    alert(`Upload completed with warnings:\n${result.errors.join('\n')}`);
                }
                setShowUploadModal(false);
                setUploadFile(null);
                fetchIDs();
            } else {
                showToast(result.msg || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error uploading file', 'error');
        }
    };

    return (
        <div className="admin-dashboard-container fade-in">
            <div className="admin-card" style={{ maxWidth: '1200px', margin: '20px auto' }}>
                <header className="admin-header">
                    <div className="admin-title" style={{ textAlign: 'center' }}>
                        User ID Management
                    </div>
                    <p className="admin-subtitle" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        Manage student and teacher identities
                    </p>
                </header>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                    <button
                        onClick={() => setActiveTab('student')}
                        className="admin-btn"
                        style={{
                            background: activeTab === 'student' ? '#3b82f6' : 'white',
                            color: activeTab === 'student' ? 'white' : '#64748b',
                            border: activeTab === 'student' ? 'none' : '1px solid #cbd5e1'
                        }}
                    >
                        👨‍🎓 Student IDs
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className="admin-btn"
                        style={{
                            background: activeTab === 'teacher' ? '#3b82f6' : 'white',
                            color: activeTab === 'teacher' ? 'white' : '#64748b',
                            border: activeTab === 'teacher' ? 'none' : '1px solid #cbd5e1'
                        }}
                    >
                        👨‍🏫 Teacher IDs
                    </button>
                </div>

                <div className="admin-card" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 2, minWidth: '300px' }}>
                            <Search size={20} color="#64748b" />
                            <input
                                type="text"
                                placeholder="Search ID or Department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Filter size={20} color="#64748b" />
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="form-input"
                                style={{ width: '120px' }}
                            >
                                <option value="All">All Years</option>
                                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                            <select
                                value={filterSemester}
                                onChange={(e) => setFilterSemester(e.target.value)}
                                className="form-input"
                                style={{ width: '120px' }}
                            >
                                <option value="All">All Semesters</option>
                                <option value="1">Sem 1</option>
                                <option value="2">Sem 2</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="admin-btn"
                                style={{ background: '#10b981', padding: '10px 20px' }}
                            >
                                <Upload size={18} /> Import CSV
                            </button>
                            <button
                                onClick={openAddModal}
                                className="admin-btn"
                                style={{ padding: '10px 20px' }}
                            >
                                <Plus size={18} /> Add New
                            </button>
                        </div>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Department</th>
                                    {activeTab === 'teacher' && <th>Subject</th>}
                                    <th>National ID</th>
                                    <th>Year/Sem</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 'bold' }}>{item.studentId || item.teacherId}</td>
                                            <td>{item.department || '-'}</td>
                                            {activeTab === 'teacher' && <td>{item.subject || '-'}</td>}
                                            <td>{item.nationalId || '-'}</td>
                                            <td>
                                                {item.year ? `Y${item.year}` : ''}
                                                {item.semester ? ` S${item.semester}` : ''}
                                            </td>
                                            <td>
                                                {item.isUsed ?
                                                    <span className="status-badge absent">Used</span> :
                                                    <span className="status-badge present">Available</span>
                                                }
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        disabled={item.isUsed}
                                                        className="admin-btn"
                                                        style={{
                                                            background: item.isUsed ? '#f1f5f9' : '#3b82f6',
                                                            color: item.isUsed ? '#cbd5e1' : 'white',
                                                            padding: '6px 12px',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="admin-btn"
                                                        style={{
                                                            background: '#ef4444',
                                                            padding: '6px 12px',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                            No IDs found for selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>Import {activeTab === 'student' ? 'Student' : 'Teacher'} IDs</h2>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
                        </div>
                        <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px' }}>
                            Upload a <strong>CSV</strong> file with headers OR an <strong>Image</strong> (JPG/PNG) containing a list of IDs.<br />
                            For CSV: <code>{activeTab === 'student' ? 'studentId, department, year, semester, nationalId' : 'teacherId, department, subject, nationalId'}</code>.
                        </p>

                        <form onSubmit={handleFileUpload}>
                            <div className="form-group">
                                <input
                                    type="file"
                                    accept=".csv, .jpg, .jpeg, .png"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="form-input"
                                    style={{ paddingTop: '10px' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowUploadModal(false)} className="admin-btn" style={{ background: '#94a3b8' }}>Cancel</button>
                                <button type="submit" className="admin-btn" style={{ background: '#10b981' }}>Upload CSV</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>{editingId ? 'Edit' : 'Add'} {activeTab === 'student' ? 'Student' : 'Teacher'} ID</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {activeTab === 'student' ? (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Student ID *</label>
                                        <input className="form-input" required value={studentForm.studentId} onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })} placeholder="e.g. UGR/1234/14" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">National ID</label>
                                        <input className="form-input" value={studentForm.nationalId} onChange={e => setStudentForm({ ...studentForm, nationalId: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <select className="form-input" value={studentForm.department} onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}>
                                            <option value="">Select Department</option>
                                            {systemSettings?.departments ? JSON.parse(systemSettings.departments).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            )) : (
                                                <>
                                                    <option value="Computer Science">Computer Science</option>
                                                    <option value="Information Systems">Information Systems</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Year</label>
                                            <select className="form-input" value={studentForm.year} onChange={e => setStudentForm({ ...studentForm, year: e.target.value })}>
                                                {systemSettings?.academic_years ? JSON.parse(systemSettings.academic_years).map(y => (
                                                    <option key={y} value={y}>Year {y}</option>
                                                )) : [1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Semester</label>
                                            <select className="form-input" value={studentForm.semester} onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })}>
                                                {systemSettings?.semesters ? JSON.parse(systemSettings.semesters).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                )) : ['1', '2'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Teacher ID *</label>
                                        <input className="form-input" required value={teacherForm.teacherId} onChange={e => setTeacherForm({ ...teacherForm, teacherId: e.target.value })} placeholder="e.g. T1001" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">National ID</label>
                                        <input className="form-input" value={teacherForm.nationalId} onChange={e => setTeacherForm({ ...teacherForm, nationalId: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <select className="form-input" value={teacherForm.department} onChange={e => setTeacherForm({ ...teacherForm, department: e.target.value })}>
                                            <option value="">Select Department</option>
                                            {systemSettings?.departments ? JSON.parse(systemSettings.departments).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            )) : <option value="Computer Science">Computer Science</option>}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <input
                                            className="form-input"
                                            list="course-names"
                                            value={teacherForm.subject}
                                            onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                                            placeholder="e.g. Mathematics"
                                        />
                                        <datalist id="course-names">
                                            {systemSettings?.courses && JSON.parse(systemSettings.courses).map(c => (
                                                <option key={c.code} value={c.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Year</label>
                                            <select className="form-input" value={teacherForm.year} onChange={e => setTeacherForm({ ...teacherForm, year: e.target.value })}>
                                                <option value="">Select Year</option>
                                                {systemSettings?.academic_years ? JSON.parse(systemSettings.academic_years).map(y => (
                                                    <option key={y} value={y}>Year {y}</option>
                                                )) : [2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Semester</label>
                                            <select className="form-input" value={teacherForm.semester} onChange={e => setTeacherForm({ ...teacherForm, semester: e.target.value })}>
                                                <option value="">Select Sem</option>
                                                {systemSettings?.semesters ? JSON.parse(systemSettings.semesters).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                )) : <option value="Fall 2024">Fall 2024</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Specialization</label>
                                        <input className="form-input" value={teacherForm.specialization} onChange={e => setTeacherForm({ ...teacherForm, specialization: e.target.value })} />
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="admin-btn" style={{ background: '#94a3b8' }}>Cancel</button>
                                <button type="submit" className="admin-btn" style={{ background: '#3b82f6' }}>{editingId ? 'Update ID' : 'Add ID'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIdManagement;
