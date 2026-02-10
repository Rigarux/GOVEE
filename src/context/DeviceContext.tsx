'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoveeDevice } from '@/lib/govee';

type DeviceContextType = {
    devices: GoveeDevice[];
    loading: boolean;
    cooldownRemaining: number;
    refreshDevices: (silent?: boolean) => Promise<void>;
    refreshDeviceStates: (deviceIds: { device: string; model: string }[]) => Promise<void>;
    updateDeviceState: (deviceId: string, newState: Partial<GoveeDevice['properties']>) => void;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
    const [devices, setDevices] = useState<GoveeDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    const refreshDevices = async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const refreshDeviceStates = async (deviceList: { device: string; model: string }[]) => {
        if (deviceList.length === 0 || cooldownRemaining > 0) return;

        try {
            const res = await fetch('/api/devices/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devices: deviceList })
            });

            if (res.status === 429) {
                const data = await res.json();
                setCooldownRemaining(data.retryAfter || 60);
                return;
            }

            if (res.ok) {
                const results = await res.json();
                results.forEach((res: any) => {
                    if (res.properties) {
                        updateDeviceState(res.device, res.properties);
                    }
                });
            }
        } catch (err) {
            console.error('Error refreshing states:', err);
        }
    };

    useEffect(() => {
        refreshDevices();
    }, []);

    // Cooldown timer
    useEffect(() => {
        if (cooldownRemaining <= 0) return;
        const timer = setInterval(() => {
            setCooldownRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownRemaining]);

    // Polling for device states
    useEffect(() => {
        if (devices.length === 0) return;
        const deviceList = devices.map(d => ({ device: d.device, model: d.model }));
        refreshDeviceStates(deviceList);
        const interval = setInterval(() => {
            refreshDeviceStates(deviceList);
        }, 30000);
        return () => clearInterval(interval);
    }, [devices.map(d => d.device).join(',')]);

    // Listen for storage changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'govee_devices') {
                refreshDevices(true);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateDeviceState = (deviceId: string, newState: Partial<GoveeDevice['properties']>) => {
        setDevices((prev) =>
            prev.map((d) =>
                d.device === deviceId
                    ? { ...d, properties: { ...d.properties, ...newState } }
                    : d
            )
        );
    };

    return (
        <DeviceContext.Provider value={{ devices, loading, cooldownRemaining, refreshDevices, refreshDeviceStates, updateDeviceState }}>
            {children}
        </DeviceContext.Provider>
    );
}

export const useDevices = () => {
    const context = useContext(DeviceContext);
    if (!context) throw new Error('useDevices must be used within DeviceProvider');
    return context;
};
