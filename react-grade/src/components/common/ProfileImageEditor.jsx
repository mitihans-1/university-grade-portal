import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Minus, Plus } from 'lucide-react';

const ProfileImageEditor = ({ image, onSave, onCancel }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 200; // Final image size
        canvas.width = size;
        canvas.height = size;

        const img = imageRef.current;

        // Draw the image onto the canvas based on current zoom and position
        // We want to capture what's inside the 200x200 circular window
        ctx.clearRect(0, 0, size, size);

        // Simple way: draw the image with the transformations
        // The container is 200x200, so we just replicate that
        const scale = zoom;
        const x = position.x + (size / 2);
        const y = position.y + (size / 2);

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        onSave(canvas.toDataURL('image/jpeg', 0.8));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                maxWidth: '90vw',
                width: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Adjust Profile Picture</h3>

                <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        width: '250px',
                        height: '250px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#f1f5f9',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        border: '4px solid #3b82f6'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <img
                        ref={imageRef}
                        src={image}
                        alt="To Crop"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            userSelect: 'none',
                            pointerEvents: 'none',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    />
                </div>

                <div style={{ width: '100%', marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Minus size={16} color="#64748b" />
                        <input
                            type="range"
                            min="0.1"
                            max="4"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{ flex: 1, cursor: 'pointer' }}
                        />
                        <Plus size={16} color="#64748b" />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                color: '#64748b',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Check size={18} /> Apply
                        </button>
                    </div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                    Drag the image to position its face correctly within the circle.
                </p>
            </div>
        </div>
    );
};

export default ProfileImageEditor;
