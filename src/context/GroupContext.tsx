'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';

export type DeviceGroup = {
    id: string;
    name: string;
    deviceIds: string[];
};

type GroupContextType = {
    groups: DeviceGroup[];
    addGroup: (name: string, deviceIds: string[]) => void;
    updateGroup: (id: string, name: string, deviceIds: string[]) => void;
    deleteGroup: (id: string) => void;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
    const [groups, setGroups] = useState<DeviceGroup[]>([]);

    useEffect(() => {
        const loadGroups = () => {
            const stored = getFromStorage<DeviceGroup[]>(STORAGE_KEYS.GROUPS, []);
            setGroups(stored);
        };

        loadGroups();

        // Listen for changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.GROUPS) {
                loadGroups();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const saveGroups = (newGroups: DeviceGroup[]) => {
        setGroups(newGroups);
        saveToStorage(STORAGE_KEYS.GROUPS, newGroups);
        // Trigger storage event manually for same-window listeners if any
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEYS.GROUPS,
            newValue: JSON.stringify(newGroups)
        }));
    };

    const addGroup = (name: string, deviceIds: string[]) => {
        const newGroup = { id: uuidv4(), name, deviceIds };
        saveGroups([...groups, newGroup]);
    };

    const updateGroup = (id: string, name: string, deviceIds: string[]) => {
        saveGroups(groups.map(g => (g.id === id ? { ...g, name, deviceIds } : g)));
    };

    const deleteGroup = (id: string) => {
        saveGroups(groups.filter(g => g.id !== id));
    };

    return (
        <GroupContext.Provider value={{ groups, addGroup, updateGroup, deleteGroup }}>
            {children}
        </GroupContext.Provider>
    );
}

export const useGroups = () => {
    const context = useContext(GroupContext);
    if (!context) throw new Error('useGroups must be used within GroupProvider');
    return context;
};
