import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { FileText, Download, Trash2, Upload, File, Image as ImageIcon } from 'lucide-react';

const CourseResources = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState('all');

    // Upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        courseCode: ''
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchResources();
    }, [filterCourse]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const data = await api.getResources(filterCourse);
            setResources(data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile || !uploadData.title || !uploadData.courseCode) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('title', uploadData.title);
            formData.append('description', uploadData.description);
            formData.append('courseCode', uploadData.courseCode);

            await api.uploadResource(formData);
            showToast('File uploaded successfully', 'success');

            // Reset form
            setUploadFile(null);
            setUploadData({ title: '', description: '', courseCode: '' });
            fetchResources();
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload file', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this resource?')) return;
        try {
            await api.deleteResource(id);
            showToast('Resource deleted', 'success');
            setResources(resources.filter(r => r.id !== id));
        } catch (error) {
            showToast('Failed to delete resource', 'error');
        }
    };

    const handleDownload = async (id, fileName) => {
        try {
            await api.downloadFile(id, fileName);
            showToast('Download started', 'info');
        } catch (error) {
            showToast('Download failed', 'error');
        }
    };

    const getFileIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FileText color="#f44336" />;
        if (t.includes('doc')) return <FileText color="#2196f3" />;
        if (t.includes('jpg') || t.includes('png')) return <ImageIcon color="#4caf50" />;
        return <File color="#666" />;
    };

    if (loading && !isUploading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 10px 0' }}>📂 Course Resources</h1>
                <p style={{ color: '#666' }}>Access study materials, assignments, and lecture notes.</p>
            </div>

            {/* Upload Section (Teacher/Admin only) */}
            {(user.permissions?.includes('enter_grades') || user.permissions?.includes('manage_users')) && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    marginBottom: '30px'
                }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={20} /> Upload New Material
                    </h3>
                    <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Title *</label>
                            <input
                                type="text"
                                value={uploadData.title}
                                onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                                placeholder="e.g. Lecture 1 Slides"
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Course Code *</label>
                            <input
                                type="text"
                                value={uploadData.courseCode}
                                onChange={e => setUploadData({ ...uploadData, courseCode: e.target.value })}
                                placeholder="e.g. CS101"
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>File *</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{ width: '100%', padding: '7px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / span 3' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Description</label>
                            <input
                                type="text"
                                value={uploadData.description}
                                onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                                placeholder="Optional description..."
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / span 3', textAlign: 'right' }}>
                            <button
                                type="submit"
                                disabled={isUploading}
                                style={{
                                    padding: '10px 25px',
                                    backgroundColor: isUploading ? '#ccc' : '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isUploading ? 'Uploading...' : <><Upload size={18} /> Upload File</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter and List */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Filter by Course Code..."
                    value={filterCourse === 'all' ? '' : filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value || 'all')}
                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', width: '250px' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {resources.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#888', backgroundColor: 'white', borderRadius: '10px' }}>
                        No resources found.
                    </div>
                ) : (
                    resources.map(file => (
                        <div key={file.id} style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '50%' }}>
                                        {getFileIcon(file.fileType || '')}
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        backgroundColor: '#e3f2fd',
                                        color: '#1565c0',
                                        padding: '4px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        {file.courseCode}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', lineHeight: '1.4' }}>{file.title}</h3>
                                <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>{file.description || 'No description'}</p>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#999', marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                    <span>By {file.uploaderName || 'Teacher'}</span>
                                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleDownload(file.id, file.fileName)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            backgroundColor: '#f5f5f5',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '5px',
                                            color: '#333',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <Download size={16} /> Download
                                    </button>
                                    {(user.permissions?.includes('manage_users') || user.id === file.uploadedBy) && (
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#ffebee',
                                                border: '1px solid #ffcdd2',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                color: '#c62828'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseResources;
