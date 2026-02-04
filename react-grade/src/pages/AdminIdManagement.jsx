import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

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
                // Check if ID exists AND strict check to ensure we aren't flagging our own ID during edit
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
                    setEditingId(null);
                    setStudentForm({ studentId: '', department: '', year: '1', semester: '1', nationalId: '' });
                    fetchIDs();
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
                    setEditingId(null);
                    setTeacherForm({ teacherId: '', department: '', subject: '', semester: '', year: '', specialization: '', nationalId: '' });
                    fetchIDs();
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

    // ... existing code ...

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
                    // Show first few errors if any partial failures
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
        <div className="fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="responsive-header" style={{ marginBottom: '20px' }}>
                <h1 style={{ color: '#1a237e', margin: 0 }}>User ID Management</h1>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search ID or Department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                                width: '100%'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="modern-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#059669', flex: '1', minWidth: 'fit-content' }}
                    >
                        <span>📂</span> Import CSV
                    </button>
                    <button
                        onClick={openAddModal}
                        className="modern-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: 'fit-content' }}
                    >
                        <span>➕</span> Add New
                    </button>
                </div>
            </div>

            {/* ... rest of the existing list/table code ... */}

            <div className="responsive-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setActiveTab('student')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'student' ? '3px solid #1a237e' : 'none',
                            color: activeTab === 'student' ? '#1a237e' : '#64748b',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        👨‍🎓 Student IDs
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'teacher' ? '3px solid #1a237e' : 'none',
                            color: activeTab === 'teacher' ? '#1a237e' : '#64748b',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        👨‍🏫 Teacher IDs
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Year:</span>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="All">All Years</option>
                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Semester:</span>
                        <select
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="All">All Semesters</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive-cards" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '15px' }}>ID</th>
                            <th style={{ padding: '15px' }}>Department</th>
                            {activeTab === 'teacher' && <th style={{ padding: '15px' }}>Subject</th>}
                            <th style={{ padding: '15px' }}>National ID</th>
                            <th style={{ padding: '15px' }}>Year/Sem</th>
                            <th style={{ padding: '15px' }}>Status</th>
                            <th style={{ padding: '15px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>

                                <td data-label="ID" style={{ padding: '15px', fontWeight: 'bold' }}>{item.studentId || item.teacherId}</td>
                                <td data-label="Department" style={{ padding: '15px' }}>{item.department || '-'}</td>
                                {activeTab === 'teacher' && <td data-label="Subject" style={{ padding: '15px' }}>{item.subject || '-'}</td>}
                                <td data-label="National ID" style={{ padding: '15px' }}>{item.nationalId || '-'}</td>
                                <td data-label="Year/Sem" style={{ padding: '15px' }}>
                                    {item.year ? `Y${item.year}` : ''}
                                    {item.semester ? ` S${item.semester}` : ''}
                                </td>
                                <td data-label="Status" style={{ padding: '15px' }}>
                                    {item.isUsed ?
                                        <span style={{ backgroundColor: '#ffcdd2', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Used</span> :
                                        <span style={{ backgroundColor: '#c8e6c9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Available</span>
                                    }
                                </td>
                                <td data-label="Actions" style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        disabled={item.isUsed}
                                        style={{
                                            backgroundColor: item.isUsed ? '#f1f5f9' : '#e3f2fd',
                                            color: item.isUsed ? '#cbd5e1' : '#1565c0',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: item.isUsed ? 'not-allowed' : 'pointer',
                                            flex: 1
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        style={{ backgroundColor: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No IDs found for selected filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginBottom: '15px' }}>Import {activeTab === 'student' ? 'Student' : 'Teacher'} IDs</h2>
                        <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px' }}>
                            Upload a <strong>CSV</strong> file with headers OR an <strong>Image</strong> (JPG/PNG) containing a list of IDs.<br />
                            For CSV: <code>{activeTab === 'student' ? 'studentId, department, year, semester, nationalId' : 'teacherId, department, subject, nationalId'}</code>.
                        </p>

                        <form onSubmit={handleFileUpload}>
                            <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                                <input
                                    type="file"
                                    accept=".csv, .jpg, .jpeg, .png"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="modern-input"
                                    style={{ paddingTop: '10px' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="modern-btn" style={{ flex: 1, backgroundColor: '#059669' }}>Upload CSV</button>
                                <button type="button" onClick={() => setShowUploadModal(false)} className="modern-btn" style={{ flex: 1, backgroundColor: '#94a3b8' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Edit' : 'Add'} {activeTab === 'student' ? 'Student' : 'Teacher'} ID</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                            {activeTab === 'student' ? (
                                <>
                                    <div className="modern-input-group">
                                        <label>Student ID *</label>
                                        <input className="modern-input" required value={studentForm.studentId} onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })} placeholder="e.g. UGR/1234/14" />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>National ID (for verification)</label>
                                        <input className="modern-input" value={studentForm.nationalId} onChange={e => setStudentForm({ ...studentForm, nationalId: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Department</label>
                                        <select className="modern-input" value={studentForm.department} onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}>
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
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div className="modern-input-group" style={{ flex: 1 }}>
                                            <label>Year</label>
                                            <select className="modern-input" value={studentForm.year} onChange={e => setStudentForm({ ...studentForm, year: e.target.value })}>
                                                {systemSettings?.academic_years ? JSON.parse(systemSettings.academic_years).map(y => (
                                                    <option key={y} value={y}>Year {y}</option>
                                                )) : [1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                        <div className="modern-input-group" style={{ flex: 1 }}>
                                            <label>Semester</label>
                                            <select className="modern-input" value={studentForm.semester} onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })}>
                                                {systemSettings?.semesters ? JSON.parse(systemSettings.semesters).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                )) : ['1', '2'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="modern-input-group">
                                        <label>Teacher ID *</label>
                                        <input className="modern-input" required value={teacherForm.teacherId} onChange={e => setTeacherForm({ ...teacherForm, teacherId: e.target.value })} placeholder="e.g. T1001" />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>National ID (for verification)</label>
                                        <input className="modern-input" value={teacherForm.nationalId} onChange={e => setTeacherForm({ ...teacherForm, nationalId: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Department</label>
                                        <select className="modern-input" value={teacherForm.department} onChange={e => setTeacherForm({ ...teacherForm, department: e.target.value })}>
                                            <option value="">Select Department</option>
                                            {systemSettings?.departments ? JSON.parse(systemSettings.departments).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            )) : <option value="Computer Science">Computer Science</option>}
                                        </select>
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Subject</label>
                                        <input
                                            className="modern-input"
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
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div className="modern-input-group" style={{ flex: 1 }}>
                                            <label>Year</label>
                                            <select className="modern-input" value={teacherForm.year} onChange={e => setTeacherForm({ ...teacherForm, year: e.target.value })}>
                                                <option value="">Select Year</option>
                                                {systemSettings?.academic_years ? JSON.parse(systemSettings.academic_years).map(y => (
                                                    <option key={y} value={y}>Year {y}</option>
                                                )) : [2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="modern-input-group" style={{ flex: 1 }}>
                                            <label>Semester</label>
                                            <select className="modern-input" value={teacherForm.semester} onChange={e => setTeacherForm({ ...teacherForm, semester: e.target.value })}>
                                                <option value="">Select Sem</option>
                                                {systemSettings?.semesters ? JSON.parse(systemSettings.semesters).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                )) : <option value="Fall 2024">Fall 2024</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Specialization</label>
                                        <input className="modern-input" value={teacherForm.specialization} onChange={e => setTeacherForm({ ...teacherForm, specialization: e.target.value })} />
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="modern-btn" style={{ flex: 1 }}>{editingId ? 'Update ID' : 'Add ID'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="modern-btn" style={{ flex: 1, backgroundColor: '#94a3b8' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminIdManagement;
