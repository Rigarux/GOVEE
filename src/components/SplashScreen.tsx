'use client';

import React, { useState, useEffect } from 'react';
import styles from '../app/page.module.css';

export const SplashScreen = () => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 1300); // 1s wait + 0.3s fade animation
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className={styles.splashOverlay}>
            <img
                src="https://ccmontserrat.com/images/logos/intelaf.jpg"
                alt="Intelaf Logo"
                className={styles.splashLogo}
            />
        </div>
    );
};
