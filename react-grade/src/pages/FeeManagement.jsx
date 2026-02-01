import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle, Trash2, Calendar, FileText, User, Layers, Filter } from 'lucide-react';

const FeeManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin Add Fee State
    const [newFee, setNewFee] = useState({
        studentId: '',
        amount: '',
        description: '',
        dueDate: '',
        targetGroup: 'single', // single, bulk
        year: 'all',
        semester: 'all',
        department: 'all',
        attachment: null
    });

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            setLoading(true);
            const data = await api.getFees();
            setFees(data || []);
        } catch (error) {
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignFee = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('amount', newFee.amount);
            formData.append('description', newFee.description);
            formData.append('dueDate', newFee.dueDate);
            formData.append('targetGroup', newFee.targetGroup);

            if (newFee.targetGroup === 'single') {
                formData.append('studentId', newFee.studentId);
            } else {
                formData.append('year', newFee.year);
                formData.append('semester', newFee.semester);
                formData.append('department', newFee.department);
            }

            if (newFee.attachment) {
                formData.append('attachment', newFee.attachment);
            }

            await api.assignFee(formData);

            showToast('Fees assigned successfully', 'success');
            setNewFee({
                studentId: '', amount: '', description: '', dueDate: '',
                targetGroup: 'single', year: 'all', semester: 'all', department: 'all', attachment: null
            });
            fetchFees();
        } catch (error) {
            console.error('Assign fee error', error);
            showToast('Failed to assign fee', 'error');
        }
    };

    const handlePay = async (id) => {
        try {
            await api.payFee(id);
            showToast('Payment successful!', 'success');
            fetchFees();
        } catch (error) {
            showToast('Payment failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this fee record?')) return;
        try {
            await api.deleteFee(id);
            showToast('Fee deleted', 'success');
            fetchFees();
        } catch (error) {
            showToast('Failed to delete fee', 'error');
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '12px' }}>
                    <DollarSign size={32} color="#0284c7" />
                </div>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Fee Management</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Track tuition, manage assignments, and view payments.</p>
                </div>
            </div>

            {/* Admin Section: Assign Fee */}
            {user.permissions?.includes('manage_fees') && (
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                        <Layers size={20} color="#6366f1" />
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Assign New Fee</h3>
                    </div>

                    <form onSubmit={handleAssignFee} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Target Audience</label>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 15px', border: newFee.targetGroup === 'single' ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: newFee.targetGroup === 'single' ? '#eff6ff' : 'white' }}>
                                    <input type="radio" checked={newFee.targetGroup === 'single'} onChange={() => setNewFee({ ...newFee, targetGroup: 'single' })} />
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>Single Student</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 15px', border: newFee.targetGroup === 'bulk' ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: newFee.targetGroup === 'bulk' ? '#eff6ff' : 'white' }}>
                                    <input type="radio" checked={newFee.targetGroup === 'bulk'} onChange={() => setNewFee({ ...newFee, targetGroup: 'bulk' })} />
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>Bulk Assignment</span>
                                </label>
                            </div>
                        </div>

                        {newFee.targetGroup === 'single' ? (
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Student ID</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        value={newFee.studentId}
                                        onChange={e => setNewFee({ ...newFee, studentId: e.target.value })}
                                        required={newFee.targetGroup === 'single'}
                                        className="modern-input"
                                        style={{ paddingLeft: '40px', width: '100%' }}
                                        placeholder="e.g. STU12345"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Target Year</label>
                                    <div style={{ position: 'relative' }}>
                                        <Filter size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <select
                                            value={newFee.year}
                                            onChange={e => setNewFee({ ...newFee, year: e.target.value })}
                                            className="modern-input"
                                            style={{ paddingLeft: '40px', width: '100%' }}
                                        >
                                            <option value="all">All Years</option>
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Target Semester</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <select
                                            value={newFee.semester}
                                            onChange={e => setNewFee({ ...newFee, semester: e.target.value })}
                                            className="modern-input"
                                            style={{ paddingLeft: '40px', width: '100%' }}
                                        >
                                            <option value="all">All Semesters</option>
                                            <option value="1">Semester 1</option>
                                            <option value="2">Semester 2</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Department</label>
                                    <select
                                        value={newFee.department}
                                        onChange={e => setNewFee({ ...newFee, department: e.target.value })}
                                        className="modern-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="all">All Departments</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electrical Engineering">Electrical Engineering</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                                        <option value="Civil Engineering">Civil Engineering</option>
                                        <option value="Medicine">Medicine</option>
                                        <option value="Business Administration">Business Administration</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Amount ($)</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="number"
                                    value={newFee.amount}
                                    onChange={e => setNewFee({ ...newFee, amount: e.target.value })}
                                    required
                                    className="modern-input"
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Due Date</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="date"
                                    value={newFee.dueDate}
                                    onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })}
                                    required
                                    className="modern-input"
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Description</label>
                            <div style={{ position: 'relative' }}>
                                <FileText size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={newFee.description}
                                    onChange={e => setNewFee({ ...newFee, description: e.target.value })}
                                    required
                                    className="modern-input"
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                    placeholder="e.g. Tuition Fee for Semester 1"
                                />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Attachment (Optional)</label>
                            <input
                                type="file"
                                onChange={e => setNewFee({ ...newFee, attachment: e.target.files[0] })}
                                className="modern-input"
                                style={{ paddingTop: '8px' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <button type="submit" className="modern-btn" style={{ width: '100%', padding: '12px', fontSize: '16px', backgroundColor: '#16a34a' }}>
                                {newFee.targetGroup === 'bulk' ? 'Bulk Assign Fees' : 'Assign Fee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fees List */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#475569' }}>Fee Records</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Description</th>
                                {user.permissions?.includes('manage_fees') && <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Student ID</th>}
                                <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Due Date</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Amount</th>
                                <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Status</th>
                                <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ padding: '15px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}>
                                                <DollarSign size={30} color="#cbd5e1" />
                                            </div>
                                        </div>
                                        No fee records found.
                                    </td>
                                </tr>
                            ) : (
                                fees.map(fee => (
                                    <tr key={fee.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="hover-bg-slate-50">
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{fee.description}</div>
                                            {fee.transactionId && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Ref: <span style={{ fontFamily: 'monospace' }}>{fee.transactionId}</span></div>}
                                        </td>
                                        {user.permissions?.includes('manage_fees') && <td style={{ padding: '15px 20px', color: '#475569', fontSize: '14px' }}>{fee.studentId}</td>}
                                        <td style={{ padding: '15px 20px', color: '#475569' }}>{new Date(fee.dueDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 20px', fontWeight: '700', color: '#0f172a' }}>${Number(fee.amount).toFixed(2)}</td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <span style={{
                                                backgroundColor: fee.status === 'paid' ? '#dcfce7' : fee.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                                                color: fee.status === 'paid' ? '#166534' : fee.status === 'overdue' ? '#991b1b' : '#92400e',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                textTransform: 'capitalize'
                                            }}>
                                                {fee.status === 'paid' ? <CheckCircle size={12} /> : fee.status === 'overdue' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                                                {fee.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                {fee.status === 'pending' && !user.permissions?.includes('manage_fees') && (
                                                    <button
                                                        onClick={() => handlePay(fee.id)}
                                                        className="modern-btn"
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        <CreditCard size={14} /> Pay
                                                    </button>
                                                )}
                                                {fee.status === 'pending' && user.permissions?.includes('manage_fees') && (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Pending Payment</span>
                                                )}
                                                {fee.status === 'paid' && (
                                                    <span style={{ color: '#22c55e', fontWeight: '600', fontSize: '13px' }}>Completed</span>
                                                )}

                                                {user.permissions?.includes('manage_fees') && (
                                                    <button
                                                        onClick={() => handleDelete(fee.id)}
                                                        title="Delete"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            padding: '6px',
                                                            opacity: 0.7,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.7}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;
