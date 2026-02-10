'use client';

import React, { useState } from 'react';
import { useGroups } from '@/context/GroupContext';
import { useDevices } from '@/context/DeviceContext';
import { Button } from './ui/Button';
import { Plus, Layers, Power, Trash2, Edit2, RotateCcw } from 'lucide-react';
import styles from './GroupList.module.css';
import { GroupControlPanel } from './GroupControlPanel';
import { controlDevice } from '@/lib/govee';

export const GroupList = () => {
    const { groups, addGroup, deleteGroup, updateGroup } = useGroups();
    const { devices, updateDeviceState } = useDevices();
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

    const handleCreate = () => {
        if (newGroupName && selectedDeviceIds.length > 0) {
            addGroup(newGroupName, selectedDeviceIds);
            setIsCreating(false);
            setNewGroupName('');
            setSelectedDeviceIds([]);
        }
    };

    const toggleDeviceSelection = (deviceId: string) => {
        setSelectedDeviceIds(prev =>
            prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
        );
    };

    const toggleGroupPower = async (groupId: string, turnOn: boolean) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        // Optimistic update for UI
        group.deviceIds.forEach(did => {
            updateDeviceState(did, { powerState: turnOn ? 'on' : 'off' });
        });

        // Send commands
        for (const deviceId of group.deviceIds) {
            const device = devices.find(d => d.device === deviceId);
            if (device) {
                try {
                    controlDevice(device.device, device.model, { name: 'turn', value: turnOn ? 'on' : 'off' });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                <Layers className="mr-2" size={20} />
                Grupos
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setIsCreating(!isCreating)}>
                    <Plus size={18} />
                </Button>
            </h2>

            {isCreating && (
                <div className={styles.creator}>
                    <input
                        className={styles.input}
                        placeholder="Nombre del grupo"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <div className={styles.deviceSelect}>
                        {devices.map(d => (
                            <div
                                key={d.device}
                                className={`${styles.selectItem} ${selectedDeviceIds.includes(d.device) ? styles.selected : ''}`}
                                onClick={() => toggleDeviceSelection(d.device)}
                            >
                                {d.deviceName}
                            </div>
                        ))}
                    </div>
                    <div className={styles.creatorActions}>
                        <Button size="sm" onClick={handleCreate} disabled={!newGroupName || selectedDeviceIds.length === 0}>Guardar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                    </div>
                </div>
            )}

            <div className={styles.list}>
                {groups.map(group => (
                    <div
                        key={group.id}
                        className={styles.card}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('groupId', group.id);
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                    >
                        <div className={styles.header}>
                            <div className={styles.info}>
                                <h3 className={styles.name}>{group.name}</h3>
                                <span className={styles.count}>{group.deviceIds.length} dispositivos</span>
                            </div>
                            <div className={styles.actions}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleGroupPower(group.id, true)}
                                    title="Encender Todo"
                                >
                                    <Power size={16} className="text-green-500" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleGroupPower(group.id, false)}
                                    title="Apagar Todo"
                                >
                                    <Power size={16} className="text-red-500" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                                    className={activeGroupId === group.id ? styles.active : ''}
                                >
                                    <Edit2 size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.dangerText}
                                    onClick={() => deleteGroup(group.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {activeGroupId && (
                <div className={styles.panelOverlay}>
                    <div className={styles.panelWrapper}>
                        <h3 className="mb-2 font-bold">Control: {groups.find(g => g.id === activeGroupId)?.name}</h3>
                        <GroupControlPanel
                            group={groups.find(g => g.id === activeGroupId)!}
                            onClose={() => setActiveGroupId(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
