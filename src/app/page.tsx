'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeviceProvider, useDevices } from '@/context/DeviceContext';
import { GroupProvider, useGroups, DeviceGroup } from '@/context/GroupContext';
import { FloorPlanProvider } from '@/context/FloorPlanContext';
import { DeviceList } from '@/components/DeviceList';
import { FloorPlanEditor } from '@/components/FloorPlanEditor';
import { Button } from '@/components/ui/Button';
import { Plus, Home, Settings, Pencil, Trash2, Check, X } from 'lucide-react';
import styles from './page.module.css';
import { GroupControlPanel } from '@/components/GroupControlPanel';
import { RateLimitOverlay } from '@/components/RateLimitOverlay';
import { SplashScreen } from '@/components/SplashScreen';

// Top Section: Room Grid
const RoomSelectionGrid = ({
    selectedGroupId,
    onSelect,
    userRole
}: {
    selectedGroupId: string | null,
    onSelect: (group: DeviceGroup) => void,
    userRole: string | null
}) => {
    const { groups, addGroup, updateGroup, deleteGroup } = useGroups();
    const isAdmin = userRole === 'admin';
    const [newGroupInput, setNewGroupInput] = useState('');
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleCreate = () => {
        if (newGroupInput.trim()) {
            addGroup(newGroupInput, []);
            setNewGroupInput('');
        }
    };

    const handleStartEdit = (e: React.MouseEvent, group: DeviceGroup) => {
        e.stopPropagation();
        setEditingRoomId(group.id);
        setEditValue(group.name);
    };

    const handleSaveEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (editValue.trim()) {
            const group = groups.find(g => g.id === id);
            if (group) {
                updateGroup(id, editValue, group.deviceIds);
            }
        }
        setEditingRoomId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingRoomId(null);
    };

    const handleDelete = (e: React.MouseEvent, group: DeviceGroup) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que deseas eliminar la habitación "${group.name}"?`)) {
            deleteGroup(group.id);
        }
    };

    return (
        <div className={styles.topSection}>
            <h2 className="text-xl font-bold mb-4 px-1 text-gray-700">Selección de Habitación</h2>
            <div className={styles.grid}>
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className={`${styles.roomCard} ${selectedGroupId === group.id ? styles.selectedCard : ''}`}
                        onClick={() => onSelect(group)}
                    >
                        {/* Action Buttons - Admin Only */}
                        {isAdmin && (
                            <div className={styles.roomActions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={(e) => handleStartEdit(e, group)}
                                    title="Editar nombre"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={(e) => handleDelete(e, group)}
                                    title="Eliminar habitación"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        <div className={styles.roomIconPlaceholder}>
                            <Home size={32} className="text-gray-400" />
                        </div>

                        {editingRoomId === group.id ? (
                            <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                                <input
                                    className="text-sm p-1 border rounded w-full"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveEdit(e as any, group.id);
                                        if (e.key === 'Escape') handleCancelEdit(e as any);
                                    }}
                                />
                                <button className="text-green-600" onClick={(e) => handleSaveEdit(e, group.id)}><Check size={16} /></button>
                                <button className="text-red-600" onClick={handleCancelEdit}><X size={16} /></button>
                            </div>
                        ) : (
                            <span className={styles.roomLabel}>{group.name}</span>
                        )}
                    </div>
                ))}

                {/* Quick Add - Admin Only */}
                {isAdmin && (
                    <div className={styles.addRoomCard}>
                        <input
                            className="w-full text-sm p-2 border rounded mb-2"
                            placeholder="Nueva Habitación..."
                            value={newGroupInput}
                            onChange={e => setNewGroupInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <Button size="sm" onClick={handleCreate} className="w-full bg-peach text-gray-800 hover:opacity-90">
                            <Plus size={16} /> Crear
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Comprehensive Room Dashboard Modal
const RoomDetailModal = ({ group, userRole, onClose }: { group: DeviceGroup, userRole: string | null, onClose: () => void }) => {
    return (
        <div className={styles.roomModalOverlay} onClick={onClose}>
            <div className={styles.roomModalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className={styles.roomModalHeader}>
                    <div className={styles.roomModalTitle}>
                        <Home size={28} className="text-orange-500" />
                        <span>{group.name}</span>
                    </div>
                    <button className={styles.roomModalClose} onClick={onClose} title="Cerrar">
                        <X size={24} />
                    </button>
                </header>

                {/* Body */}
                <div className={styles.roomModalBody}>
                    {/* Sidebar: Controls & Devices */}
                    <aside className={styles.roomModalSidebar}>
                        {/* Adjustments Section */}
                        <div className={styles.modalSection}>
                            <h3 className={styles.modalSectionTitle}>Ajustes de Grupo</h3>
                            <GroupControlPanel
                                group={group}
                                onClose={onClose}
                                userRole={userRole || undefined}
                                isSection
                            />
                        </div>

                        {/* Device List Section */}
                        <div className={styles.modalSection} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                            <h3 className={styles.modalSectionTitle}>Dispositivos</h3>
                            <div className="flex-1 overflow-auto">
                                <DeviceList deviceIds={group.deviceIds} userRole={userRole || undefined} />
                            </div>
                        </div>
                    </aside>

                    {/* Main Area: Floor Plan */}
                    <main className={styles.roomModalMain}>
                        <FloorPlanEditor roomId={group.id} userRole={userRole || undefined} />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    return (
        <DeviceProvider>
            <GroupProvider>
                <FloorPlanProvider>
                    <DashboardLayout />
                </FloorPlanProvider>
            </GroupProvider>
        </DeviceProvider>
    );
}

function DashboardLayout() {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const { refreshDevices, refreshDeviceStates, devices: allDevices, cooldownRemaining } = useDevices();
    const { groups } = useGroups();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('intelaf_auth_token');
        const role = localStorage.getItem('intelaf_role');
        if (!token) {
            router.push('/login');
        } else {
            setIsAuthorized(true);
            setUserRole(role);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('intelaf_auth_token');
        localStorage.removeItem('intelaf_role');
        router.push('/login');
    };

    const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

    const handleGroupSelect = async (group: DeviceGroup) => {
        // 1. Silent refresh of device list first
        await refreshDevices(true);

        // 2. Identify devices in this specific group
        const groupDevices = allDevices
            .filter(d => group.deviceIds.includes(d.device))
            .map(d => ({ device: d.device, model: d.model }));

        // 3. Update their states from API before showing
        if (groupDevices.length > 0) {
            await refreshDeviceStates(groupDevices);
        }

        setSelectedGroupId(group.id);
    };

    if (!isAuthorized) {
        return <div className="h-screen flex items-center justify-center bg-peach text-gray-700">Verificando acceso...</div>;
    }

    return (
        <div className={`${styles.wrapper} fade-in`}>
            <SplashScreen />
            <RateLimitOverlay secondsRemaining={cooldownRemaining} />
            <header className={styles.header}>
                <div className="font-bold text-lg text-white">Intelaf S,A</div>
                <h1 className={styles.pageTitle}>Remote light</h1>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:text-red-200">
                        Cerrar Sesión
                    </Button>
                </div>
            </header>

            <main className={styles.main}>
                <RoomSelectionGrid
                    selectedGroupId={selectedGroupId}
                    onSelect={handleGroupSelect}
                    userRole={userRole}
                />

                {selectedGroup && (
                    <RoomDetailModal
                        group={selectedGroup}
                        userRole={userRole}
                        onClose={() => setSelectedGroupId(null)}
                    />
                )}

                <footer className={styles.footer}>
                    <div className={styles.footerText}>Sistema de uso interno Intelaf 2026.</div>
                </footer>
            </main>
        </div>
    );
}
