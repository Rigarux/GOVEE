'use client';

import React from 'react';
import { useDevices } from '@/context/DeviceContext';
import styles from './DeviceList.module.css';
import { Lightbulb, Power, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';

export const DeviceList = ({ deviceIds, userRole = 'admin' }: { deviceIds?: string[], userRole?: string }) => {
    const isAdmin = userRole === 'admin';
    const { devices, loading, updateDeviceState } = useDevices();

    if (loading) {
        return <div className={styles.loading}>Cargando dispositivos...</div>;
    }

    const filteredDevices = React.useMemo(() =>
        deviceIds ? devices.filter(d => deviceIds.includes(d.device)) : devices,
        [devices, deviceIds]);

    return (
        <div className={styles.container}>
            <div className={styles.list}>
                {filteredDevices.map((device) => (
                    <div
                        key={device.device}
                        className={styles.card}
                        draggable={isAdmin}
                        onDragStart={(e) => {
                            if (!isAdmin) return;
                            e.dataTransfer.setData('deviceId', device.device);
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                    >
                        <div className={styles.header}>
                            <div className={styles.icon}>
                                <Lightbulb size={20} className={device.properties?.powerState === 'on' ? styles.on : styles.off} />
                            </div>
                            <div className={styles.info}>
                                <h3 className={styles.name}>{device.deviceName}</h3>
                                <span className={styles.model}>{device.model}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {devices.length === 0 && (
                    <div className={styles.empty}>
                        <WifiOff size={24} />
                        <p>No se encontraron dispositivos</p>
                    </div>
                )}
            </div>
        </div>
    );
};
