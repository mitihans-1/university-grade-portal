import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Mail, Phone, MessageSquare, BookOpen, Send, ChevronDown, ChevronUp } from 'lucide-react';

const SupportPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('faq');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'medium'
    });
    const [submitStatus, setSubmitStatus] = useState('');

    const faqs = [
        {
            question: "How do I view my grades?",
            answer: "Navigate to the 'Grades' section from the sidebar menu. Your grades will be displayed by semester and course."
        },
        {
            question: "How can I link my child's account (Parents)?",
            answer: "Go to 'Link New Student' in the menu, enter your child's student ID, and submit the request. An administrator will approve the link."
        },
        {
            question: "How do I change my password?",
            answer: "Visit the 'Settings' page from the sidebar menu and use the 'Change Password' section to update your credentials."
        },
        {
            question: "Why can't I see my attendance?",
            answer: "Attendance records are updated by administrators and teachers. If you don't see your attendance, please contact your institution's admin office."
        },
        {
            question: "How do I upload grades (Teachers)?",
            answer: "Use the 'Upload Grades' option from the teacher dashboard. You can upload individual grades or use CSV for batch upload."
        },
        {
            question: "How do I pay my fees?",
            answer: "Visit the 'Fees' section to view your fee status and payment instructions. Contact the finance office for payment methods."
        },
        {
            question: "Can I appeal a grade?",
            answer: "Yes! Go to the 'Grade Appeals' section (if available for your role) to submit an appeal with supporting documentation."
        },
        {
            question: "How do I receive notifications?",
            answer: "You can set your notification preferences (Email/SMS/Both) in the Settings page. Make sure your contact information is up to date."
        }
    ];

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('sending');

        // Simulate sending (you can implement actual API call here)
        setTimeout(() => {
            setSubmitStatus('success');
            setFormData({ subject: '', message: '', priority: 'medium' });
            setTimeout(() => setSubmitStatus(''), 3000);
        }, 1000);
    };

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <HelpCircle size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
                <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b' }}>
                    {t('support') || 'Support Center'}
                </h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
                    We're here to help! Find answers or contact us directly.
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setActiveTab('faq')}
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '12px 20px',
                        backgroundColor: activeTab === 'faq' ? '#3b82f6' : 'white',
                        color: activeTab === 'faq' ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <BookOpen size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    FAQs
                </button>
                <button
                    onClick={() => setActiveTab('contact')}
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '12px 20px',
                        backgroundColor: activeTab === 'contact' ? '#3b82f6' : 'white',
                        color: activeTab === 'contact' ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Contact Us
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    style={{
                        flex: '1',
                        minWidth: '150px',
                        padding: '12px 20px',
                        backgroundColor: activeTab === 'info' ? '#3b82f6' : 'white',
                        color: activeTab === 'info' ? 'white' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <Phone size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Contact Info
                </button>
            </div>

            {/* FAQs Tab */}
            {activeTab === 'faq' && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '22px' }}>
                        Frequently Asked Questions
                    </h2>
                    <div style={{ marginTop: '24px' }}>
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                style={{
                                    borderBottom: '1px solid #e2e8f0',
                                    paddingBottom: '16px',
                                    marginBottom: '16px'
                                }}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'none',
                                        border: 'none',
                                        padding: '12px 0',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                                        {faq.question}
                                    </span>
                                    {expandedFaq === index ? (
                                        <ChevronUp size={20} style={{ color: '#3b82f6' }} />
                                    ) : (
                                        <ChevronDown size={20} style={{ color: '#64748b' }} />
                                    )}
                                </button>
                                {expandedFaq === index && (
                                    <div style={{
                                        padding: '12px 0',
                                        color: '#64748b',
                                        lineHeight: '1.6'
                                    }}>
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Form Tab */}
            {activeTab === 'contact' && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '22px' }}>
                        Send Us a Message
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Fill out the form below and we'll get back to you as soon as possible.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#1e293b'
                            }}>
                                Subject *
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                required
                                placeholder="Brief description of your issue"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#1e293b'
                            }}>
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="low">Low - General inquiry</option>
                                <option value="medium">Medium - Need assistance</option>
                                <option value="high">High - Urgent issue</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#1e293b'
                            }}>
                                Message *
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows="6"
                                placeholder="Describe your issue or question in detail..."
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitStatus === 'sending'}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: submitStatus === 'success' ? '#10b981' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: submitStatus === 'sending' ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: submitStatus === 'sending' ? 0.7 : 1
                            }}
                        >
                            <Send size={18} />
                            {submitStatus === 'sending' ? 'Sending...' : submitStatus === 'success' ? 'Sent!' : 'Send Message'}
                        </button>

                        {submitStatus === 'success' && (
                            <p style={{ color: '#10b981', marginTop: '12px', fontWeight: '500' }}>
                                ✓ Your message has been sent successfully. We'll get back to you soon!
                            </p>
                        )}
                    </form>
                </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'info' && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '22px' }}>
                        Contact Information
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>
                        You can reach us through any of the following channels:
                    </p>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        {/* Email */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Mail size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Email</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>support@university.edu</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                    We typically respond within 24-48 hours
                                </p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#10b981',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Phone size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Phone</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>+251 11 123 4567</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                    Monday - Friday, 8:00 AM - 5:00 PM
                                </p>
                            </div>
                        </div>

                        {/* Office */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#f59e0b',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '24px'
                            }}>
                                🏢
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Office</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>IT Support Center, Main Building</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                    Walk-ins welcome during office hours
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div style={{
                        marginTop: '32px',
                        padding: '20px',
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#1e40af', fontSize: '16px' }}>
                            💡 Quick Tips
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', lineHeight: '1.8' }}>
                            <li>Check the FAQs section first - your question might already be answered!</li>
                            <li>Have your student/staff ID ready when contacting support</li>
                            <li>For urgent technical issues during exams, call the support hotline directly</li>
                            <li>Use the Messages feature to communicate with your teachers and admin</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportPage;