import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import styles from './RateLimitOverlay.module.css';

interface RateLimitOverlayProps {
    secondsRemaining: number;
}

export const RateLimitOverlay: React.FC<RateLimitOverlayProps> = ({ secondsRemaining }) => {
    if (secondsRemaining <= 0) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={48} className={styles.warningIcon} />
                </div>
                <h2 className={styles.title}>COMUNICACIÓN INTERRUMPIDA</h2>
                <div className={styles.statusBadge}>ESTADO: DESCONECTADO</div>
                <p className={styles.description}>
                    Se ha perdido la conexión con la API de Govee debido al límite de peticiones.
                    Por seguridad, el sistema se ha pausado por completo. **Espera obligatoria.**
                </p>
                <div className={styles.timerContainer}>
                    <Clock size={24} className={styles.clockIcon} />
                    <span className={styles.timerText}>RECONECTANDO EN {secondsRemaining}s</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${(secondsRemaining / 60) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
