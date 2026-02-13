import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';
import { api } from '../utils/api';
import { FileText, Download, Trash2, Upload, File, Image as ImageIcon, Search, BookOpen, ChevronRight, User } from 'lucide-react';
import '../premium-pages.css';

const CourseResources = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState('all');

    const [uploadFile, setUploadFile] = useState(null);
    const [uploadData, setUploadData] = useState({ title: '', description: '', courseCode: '' });
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

    const handleFileChange = (e) => setUploadFile(e.target.files[0]);

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
            setUploadFile(null);
            setUploadData({ title: '', description: '', courseCode: '' });
            fetchResources();
        } catch (error) {
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
        if (t.includes('pdf')) return <FileText size={24} style={{ color: '#ff4b2b' }} />;
        if (t.includes('doc')) return <FileText size={24} style={{ color: '#00c9ff' }} />;
        if (t.includes('jpg') || t.includes('png')) return <ImageIcon size={24} style={{ color: '#92fe9d' }} />;
        return <File size={24} style={{ opacity: 0.5 }} />;
    };

    if (loading && !isUploading) return <LoadingSpinner fullScreen />;

    return (
        <div className="premium-page-container fade-in">
            <div className="premium-glass-card">
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="premium-title">{t('courseResources') || 'Academic Library'}</h1>
                    <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', opacity: 0.9 }}>REPOSITORY</span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,198,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {user.name}
                        </span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontWeight: '500', opacity: 0.9, letterSpacing: '1px' }}>MATERIALS: {resources.length}</span>
                    </div>
                </header>

                {(user.permissions?.includes('enter_grades') || user.permissions?.includes('manage_users')) && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
                        <h3 style={{ marginBottom: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Upload size={20} /> Upload New Material
                        </h3>
                        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <input required className="premium-btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} placeholder="Title" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} />
                            <input required className="premium-btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} placeholder="Course Code" value={uploadData.courseCode} onChange={e => setUploadData({ ...uploadData, courseCode: e.target.value })} />
                            <input type="file" required className="premium-btn" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 15px' }} onChange={handleFileChange} />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <input className="premium-btn" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} placeholder="Short Description (Optional)" value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isUploading} className="premium-btn" style={{ gridColumn: '1 / -1', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none' }}>
                                {isUploading ? 'Uploading...' : 'Publish Resource'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ position: 'relative', marginBottom: '40px' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={20} />
                    <input
                        type="text"
                        placeholder="Search materials by course code..."
                        className="premium-btn"
                        style={{ width: '100%', padding: '15px 15px 15px 55px', textAlign: 'left', background: 'rgba(255,255,255,0.05)', fontSize: '1rem' }}
                        value={filterCourse === 'all' ? '' : filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value || 'all')}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                    {resources.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                            <BookOpen size={60} style={{ marginBottom: '20px' }} />
                            <h3>No materials found...</h3>
                        </div>
                    ) : (
                        resources.map(file => (
                            <div key={file.id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '30px',
                                borderRadius: '25px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease'
                            }} className="info-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '15px' }}>
                                        {getFileIcon(file.fileType || '')}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '900', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '50px', letterSpacing: '1px' }}>
                                        {file.courseCode}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '10px' }}>{file.title}</h3>
                                <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '25px', flexGrow: 1 }}>{file.description || 'No additional details provided.'}</p>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', opacity: 0.5 }}>
                                        <User size={14} /> {file.uploaderName || 'Faculty'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleDownload(file.id, file.fileName)} className="premium-btn" style={{ padding: '8px 15px', fontSize: '12px', background: 'rgba(255,255,255,0.08)', border: 'none' }}>
                                            <Download size={14} />
                                        </button>
                                        {(user.permissions?.includes('manage_users') || user.id === file.uploadedBy) && (
                                            <button onClick={() => handleDelete(file.id)} className="premium-btn" style={{ padding: '8px 15px', fontSize: '12px', background: 'rgba(255, 75, 43, 0.1)', color: '#ff4b2b', border: 'none' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseResources;
