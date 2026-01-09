import { QRCodeSVG } from 'qrcode.react';

const IdentityCard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user || !(user.permissions?.includes('view_own_grades') && !user.permissions?.includes('view_child_grades'))) {
        return <div style={{ padding: '20px' }}>Access Denied</div>;
    }

    const handlePrint = () => {
        window.print();
    };

    // Prepare QR data
    const qrData = JSON.stringify({
        role: 'student',
        id: user.id || user.studentId,
        studentId: user.studentId,
        name: user.name,
        department: user.department,
        year: user.year,
        nationalId: user.nationalId
    });

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0' }}>🪪 {t('studentIdCard') || 'Student ID Card'}</h1>
                    <p style={{ color: '#666' }}>Your official digital notification of identity.</p>
                </div>
                <button
                    onClick={handlePrint}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold'
                    }}
                >
                    <Printer size={18} /> Print Card
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="id-card" style={{
                    width: '450px',
                    height: '280px',
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    padding: '25px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: '"Segoe UI", sans-serif'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute', top: '-50px', right: '-50px',
                        width: '200px', height: '200px',
                        borderRadius: '50%',
                        border: '30px solid rgba(255,255,255,0.1)'
                    }}></div>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Award color="#1e3c72" size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>University Portal</div>
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>Official Student ID</div>
                            </div>
                        </div>
                        {user.isVerified && (
                            <div style={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                ✓ Verified
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', gap: '25px' }}>
                        {/* Photo column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                            <div style={{
                                width: '100px', height: '120px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                color: '#ccc',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                <User size={50} color="#ccc" />
                            </div>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '5px',
                                borderRadius: '5px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <QRCodeSVG value={qrData} size={60} />
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '2px' }}>{user.name}</div>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '12px', color: '#ffd700', fontWeight: 'bold' }}>
                                ID: {user.studentId}
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{t('nationalId')} (Fayda)</div>
                                <div style={{ fontSize: '13px', fontWeight: '500' }}>{user.nationalId || 'Not Registered'}</div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Department</div>
                                <div style={{ fontSize: '13px', fontWeight: '500' }}>{user.department}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Year</div>
                                    <div style={{ fontSize: '12px' }}>{user.year || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Issued</div>
                                    <div style={{ fontSize: '12px' }}>{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                    body * { visibility: hidden; }
                    #id-card, #id-card * { visibility: visible; }
                    #id-card { 
                        position: absolute; 
                        left: 50%; 
                        top: 100px;
                        transform: translateX(-50%);
                        box-shadow: none !important; 
                        margin: 0;
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};

export default IdentityCard;
