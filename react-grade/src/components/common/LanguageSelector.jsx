import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSelector = ({ style }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'am', label: 'Amharic', flag: '🇪🇹' },
        { code: 'om', label: 'Oromoo', flag: '🌳' },
        { code: 'so', label: 'Somali', flag: '🇸🇴' }
    ];

    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    const currentLanguage = languages.find(l => l.code === language) || languages[0];

    return (
        <div style={{ position: 'relative', ...style }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    ...style?.button
                }}
                title="Select Language"
            >
                <span>{currentLanguage.label}</span>
                <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '5px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    border: '1px solid #eee',
                    minWidth: '150px',
                    zIndex: 1000,
                    overflow: 'hidden'
                }}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '10px 15px',
                                border: 'none',
                                backgroundColor: language === lang.code ? '#f0f7ff' : 'white',
                                color: language === lang.code ? '#1976d2' : '#333',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: language === lang.code ? 'bold' : 'normal',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (language !== lang.code) e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                if (language !== lang.code) e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
