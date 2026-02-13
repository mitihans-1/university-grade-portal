import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../utils/api';

const QRScanner = ({ onScanSuccess, onError }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // Create scanner instance
        // "reader" is the HTML element ID
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Handle Success
                console.log("QR Code Scanned:", decodedText);
                scanner.clear(); // Stop scanning on success
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // handle scan error (ignore frame errors)
                // console.warn(errorMessage);
                if (onError) onError(errorMessage);
            }
        );

        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, []);

    return (
        <div style={{ textAlign: 'center' }}>
            <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
            <p className="mt-2 text-sm text-gray-500">
                Point your camera at the class QR code
            </p>
        </div>
    );
};

export default QRScanner;
