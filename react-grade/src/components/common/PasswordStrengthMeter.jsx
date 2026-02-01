import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
    const getStrength = (pass) => {
        let strength = 0;
        if (pass.length === 0) return 0;
        if (pass.length >= 8) strength += 20;
        if (/[a-z]/.test(pass)) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[@$!%*#?&]/.test(pass)) strength += 20;
        return strength;
    };

    const strength = getStrength(password);

    const getLabel = (s) => {
        if (s === 0) return '';
        if (s <= 20) return 'Very Weak';
        if (s <= 40) return 'Weak';
        if (s <= 60) return 'Medium';
        if (s <= 80) return 'Strong';
        return 'Very Strong';
    };

    const getColor = (s) => {
        if (s <= 20) return '#ef4444'; // Red
        if (s <= 40) return '#f97316'; // Orange
        if (s <= 60) return '#eab308'; // Yellow
        if (s <= 80) return '#84cc16'; // Lime
        return '#22c55e'; // Green
    };

    return (
        <div style={{ marginTop: '8px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Password Strength:</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: getColor(strength) }}>{getLabel(strength)} ({strength}%)</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${strength}%`,
                        backgroundColor: getColor(strength),
                        transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '8px' }}>
                <RequirementMet met={password.length >= 8} text="Min 8 chars" />
                <RequirementMet met={/[A-Z]/.test(password)} text="Uppercase" />
                <RequirementMet met={/[a-z]/.test(password)} text="Lowercase" />
                <RequirementMet met={/[0-9]/.test(password)} text="Number" />
                <RequirementMet met={/[@$!%*#?&]/.test(password)} text="Special char" />
            </div>
        </div>
    );
};

const RequirementMet = ({ met, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: met ? '#22c55e' : '#94a3b8' }}>
        {met ? '✅' : '○'} {text}
    </div>
);

export default PasswordStrengthMeter;
