'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export type FloorPlanMarker = {
    id: string;
    deviceId?: string;
    groupId?: string;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    rotation?: number; // Degrees 0-360
    label?: string; // Optional custom label
    width?: number; // Optional relative width/scale
    height?: number;
    segments?: { color: { r: number; g: number; b: number }; brightness: number }[];
};

export type FloorPlan = {
    id: string;
    name: string;
    roomId: string; // Association with a specific room
    imageData: string; // Base64 string for simplicity in localStorage
    markers: FloorPlanMarker[];
};

type FloorPlanContextType = {
    plans: FloorPlan[];
    addPlan: (name: string, imageData: string, roomId: string) => void;
    deletePlan: (id: string) => void;
    updatePlanMarkers: (planId: string, markers: FloorPlanMarker[]) => void;
    updatePlanName: (id: string, name: string) => void;
    updateDeviceSegments: (deviceId: string, segments: { color: { r: number; g: number; b: number }; brightness: number }[]) => void;
};

const FloorPlanContext = createContext<FloorPlanContextType | undefined>(undefined);

export function FloorPlanProvider({ children }: { children: ReactNode }) {
    const [plans, setPlans] = useState<FloorPlan[]>([]);

    useEffect(() => {
        const stored = getFromStorage<FloorPlan[]>(STORAGE_KEYS.FLOOR_PLANS, []);
        setPlans(stored);
    }, []);

    const savePlans = (newPlans: FloorPlan[]) => {
        setPlans(newPlans);
        saveToStorage(STORAGE_KEYS.FLOOR_PLANS, newPlans);
    };

    const addPlan = (name: string, imageData: string, roomId: string) => {
        const newPlan = { id: uuidv4(), name, imageData, roomId, markers: [] };
        savePlans([...plans, newPlan]);
    };

    const deletePlan = (id: string) => {
        savePlans(plans.filter(p => p.id !== id));
    };

    const updatePlanMarkers = (planId: string, markers: FloorPlanMarker[]) => {
        savePlans(plans.map(p => (p.id === planId ? { ...p, markers } : p)));
    };

    const updatePlanName = (id: string, name: string) => {
        savePlans(plans.map(p => (p.id === id ? { ...p, name } : p)));
    };

    const updateDeviceSegments = (deviceId: string, segments: { color: { r: number; g: number; b: number }; brightness: number }[]) => {
        const newPlans = plans.map(plan => ({
            ...plan,
            markers: plan.markers.map(marker =>
                marker.deviceId === deviceId ? { ...marker, segments } : marker
            )
        }));
        savePlans(newPlans);
    };

    return (
        <FloorPlanContext.Provider value={{ plans, addPlan, deletePlan, updatePlanMarkers, updatePlanName, updateDeviceSegments }}>
            {children}
        </FloorPlanContext.Provider>
    );
}

export const useFloorPlans = () => {
    const context = useContext(FloorPlanContext);
    if (!context) throw new Error('useFloorPlans must be used within FloorPlanProvider');
    return context;
};
