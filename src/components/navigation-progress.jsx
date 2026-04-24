/**
 * @file navigation-progress.jsx
 * @description Componente reutilizable de UI: navigation-progress.
 * @module Frontend Component
 * @path /frontend/src/components/navigation-progress.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';

export default function NavigationProgress() {
    const ref = useRef(null);
    const location = useLocation();

    useEffect(() => {
        // Start the loading bar when route changes
        ref.current?.continuousStart();

        // Complete the loading bar after a short delay
        const timer = setTimeout(() => {
            ref.current?.complete();
        }, 300);

        return () => {
            clearTimeout(timer);
            ref.current?.complete();
        };
    }, [location]);

    return (
        <LoadingBar
            color="#8bc34a"
            ref={ref}
            height={3}
            shadow={true}
        />
    );
}
