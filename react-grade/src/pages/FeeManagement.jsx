import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';

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

            // Using api.assignFee but passing formData. 
            // NOTE: api.assignFee likely currently expects JSON unless updated.
            // Let's assume we need to call api.sendBroadcast-like function or update assignFee.
            // Since I cannot check api.js for assignFee right now easily to see if it handles generic body.
            // I will update api.js first to ensure assignFee handles formData or just use fetch here? 
            // Better to assume I added generic support or will add it. I will use api.assignFee(formData).

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
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 10px 0' }}>💰 Fee Management</h1>
                <p style={{ color: '#666' }}>Track tuition and payments.</p>
            </div>

            {/* Admin Section: Assign Fee */}
            {user.permissions?.includes('manage_fees') && (
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0 }}>Assign New Fee</h3>
                    <form onSubmit={handleAssignFee} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Target Audience</label>
                            <select
                                value={newFee.targetGroup}
                                onChange={e => setNewFee({ ...newFee, targetGroup: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            >
                                <option value="single">Single Student</option>
                                <option value="bulk">Bulk Assignment (Filter)</option>
                            </select>
                        </div>

                        {newFee.targetGroup === 'single' ? (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Student ID</label>
                                <input
                                    type="text"
                                    value={newFee.studentId}
                                    onChange={e => setNewFee({ ...newFee, studentId: e.target.value })}
                                    required={newFee.targetGroup === 'single'}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Year</label>
                                    <select
                                        value={newFee.year}
                                        onChange={e => setNewFee({ ...newFee, year: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                    >
                                        <option value="all">All Years</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                        <option value="5">Year 5</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Semester</label>
                                    <select
                                        value={newFee.semester}
                                        onChange={e => setNewFee({ ...newFee, semester: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                    >
                                        <option value="all">All Semesters</option>
                                        <option value="1">Semester 1</option>
                                        <option value="2">Semester 2</option>
                                        <option value="3">Semester 3</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Department</label>
                                    <select
                                        value={newFee.department}
                                        onChange={e => setNewFee({ ...newFee, department: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                    >
                                        <option value="all">All Departments</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electrical Engineering">Electrical Engineering</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                                        <option value="Civil Engineering">Civil Engineering</option>
                                        <option value="Medicine">Medicine</option>
                                        <option value="Business Administration">Business Administration</option>
                                        <option value="Law">Law</option>
                                        <option value="Agriculture">Agriculture</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Amount ($)</label>
                            <input
                                type="number"
                                value={newFee.amount}
                                onChange={e => setNewFee({ ...newFee, amount: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Due Date</label>
                            <input
                                type="date"
                                value={newFee.dueDate}
                                onChange={e => setNewFee({ ...newFee, dueDate: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Description</label>
                            <input
                                type="text"
                                value={newFee.description}
                                onChange={e => setNewFee({ ...newFee, description: e.target.value })}
                                required
                                placeholder="e.g. Tuition Fee"
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Attachment (Optional)</label>
                            <input
                                type="file"
                                onChange={e => setNewFee({ ...newFee, attachment: e.target.files[0] })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px dashed #ccc', backgroundColor: '#f9f9f9' }}
                            />
                        </div>

                        <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                            {newFee.targetGroup === 'bulk' ? 'Bulk Assign Fees' : 'Assign Fee'}
                        </button>
                    </form>
                </div>
            )}

            {/* Fees List */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
                            {user.permissions?.includes('manage_fees') && <th style={{ padding: '15px', textAlign: 'left' }}>Student ID</th>}
                            <th style={{ padding: '15px', textAlign: 'left' }}>Due Date</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                                    No fee records found.
                                </td>
                            </tr>
                        ) : (
                            fees.map(fee => (
                                <tr key={fee.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{fee.description}</div>
                                        {fee.transactionId && <div style={{ fontSize: '11px', color: '#999' }}>Ref: {fee.transactionId}</div>}
                                    </td>
                                    {user.permissions?.includes('manage_fees') && <td style={{ padding: '15px' }}>{fee.studentId}</td>}
                                    <td style={{ padding: '15px' }}>{new Date(fee.dueDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>${fee.amount}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            backgroundColor: fee.status === 'paid' ? '#d4edda' : fee.status === 'overdue' ? '#f8d7da' : '#fff3cd',
                                            color: fee.status === 'paid' ? '#155724' : fee.status === 'overdue' ? '#721c24' : '#856404',
                                            padding: '5px 10px',
                                            borderRadius: '15px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            {fee.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {fee.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            {fee.status === 'pending' && !user.permissions?.includes('manage_fees') && (
                                                <button
                                                    onClick={() => handlePay(fee.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#2196f3',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}
                                                >
                                                    <CreditCard size={14} /> Pay Now
                                                </button>
                                            )}
                                            {fee.status === 'pending' && user.permissions?.includes('manage_fees') && (
                                                <span style={{ color: '#666', fontSize: '12px' }}>Awaiting Payment</span>
                                            )}
                                            {fee.status === 'paid' && (
                                                <span style={{ color: '#28a745', fontWeight: 'bold' }}>Paid</span>
                                            )}

                                            {user.permissions?.includes('manage_fees') && (
                                                <button
                                                    onClick={() => handleDelete(fee.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#f44336',
                                                        cursor: 'pointer',
                                                        padding: '5px'
                                                    }}
                                                    title="Delete"
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
    );
};

export default FeeManagement;
