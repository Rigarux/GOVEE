import React, { useState } from 'react';
import { DeviceGroup, useGroups } from '@/context/GroupContext';
import { useDevices } from '@/context/DeviceContext';
import { controlDevice, controlSegmented } from '@/lib/govee';
import { Slider } from './ui/Slider';
import { ColorPicker } from './ColorPicker';
import styles from './GroupControlPanel.module.css';
import { Button } from './ui/Button';
import { Settings, Check, X, Plus, Power, Layers } from 'lucide-react';
import { SegmentControl } from './SegmentControl';
import { useFloorPlans } from '@/context/FloorPlanContext';

interface GroupControlPanelProps {
    group: DeviceGroup;
    onClose: () => void;
    userRole?: string;
}

export const GroupControlPanel: React.FC<GroupControlPanelProps & { isSection?: boolean }> = ({
    group,
    onClose,
    userRole = 'admin',
    isSection = false
}) => {
    const isAdmin = userRole === 'admin';
    const { devices: allDevices, updateDeviceState } = useDevices();
    const { updateGroup } = useGroups();
    const { plans, updateDeviceSegments } = useFloorPlans();
    const [brightness, setBrightness] = useState(100);
    const [color, setColor] = useState({ r: 255, g: 255, b: 255 });
    const [isEditingDevices, setIsEditingDevices] = useState(false);
    const [showSegmentControl, setShowSegmentControl] = useState<string | null>(null);

    const groupDevices = allDevices.filter(d => group.deviceIds.includes(d.device));

    const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setBrightness(val);

        // Update State
        groupDevices.forEach(d => updateDeviceState(d.device, { brightness: val }));

        // Send Commands
        groupDevices.forEach(d => {
            controlDevice(d.device, d.model, { name: 'brightness', value: val }).catch(console.error);
        });
    };

    const handleColorChange = async (newColor: { r: number; g: number; b: number }) => {
        setColor(newColor);

        // Update State
        groupDevices.forEach(d => updateDeviceState(d.device, { color: newColor }));

        // Send Commands
        groupDevices.forEach(d => {
            controlDevice(d.device, d.model, { name: 'color', value: newColor }).catch(console.error);
        });
    };

    const handlePowerToggle = async (turnOn: boolean) => {
        const newState = turnOn ? 'on' : 'off';

        // Update State
        groupDevices.forEach(d => updateDeviceState(d.device, { powerState: newState }));

        // Send Commands
        groupDevices.forEach(d => {
            controlDevice(d.device, d.model, {
                name: 'turn',
                value: newState
            }).catch(console.error);
        });
    };

    const toggleDevice = (deviceId: string) => {
        const isSelected = group.deviceIds.includes(deviceId);
        const newDeviceIds = isSelected
            ? group.deviceIds.filter(id => id !== deviceId)
            : [...group.deviceIds, deviceId];

        updateGroup(group.id, group.name, newDeviceIds);
    };
    return (
        <div className={styles.container}>
            {!isSection && (
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Panel de Control</h2>
                    <button onClick={onClose} className={styles.closeBtn} title="Cerrar">
                        <X size={24} />
                    </button>
                </div>
            )}

            {!isEditingDevices ? (
                <>
                    <div className={styles.powerSection}>
                        <Button
                            className={`${styles.powerBtn} ${styles.powerOnBtn}`}
                            onClick={() => handlePowerToggle(true)}
                        >
                            <Power size={18} /> ENCENDER
                        </Button>
                        <Button
                            className={`${styles.powerBtn} ${styles.powerOffBtn}`}
                            onClick={() => handlePowerToggle(false)}
                        >
                            <Power size={18} /> APAGAR
                        </Button>
                    </div>

                    <div className={styles.section}>
                        <label>Brillo Conjunto</label>
                        <Slider value={brightness} min={0} max={100} onChange={handleBrightnessChange} />
                    </div>

                    <div className={styles.section}>
                        <label>Color Conjunto</label>
                        <ColorPicker color={color} onChange={handleColorChange} />
                    </div>

                    <div className={styles.deviceList}>
                        <span className={styles.sublabel}>Dispositivos en la habitación:</span>
                        <div className={styles.chips}>
                            {groupDevices.map(d => {
                                // Find any marker associated with this device to get persisted segments
                                const markerWithSegments = plans
                                    .flatMap(p => p.markers)
                                    .find(m => m.deviceId === d.device && m.segments);

                                return (
                                    <div key={d.device} className={styles.chipWrapper}>
                                        <span className={styles.chip}>{d.deviceName}</span>
                                        <button
                                            className={styles.segmentIconBtn}
                                            onClick={() => setShowSegmentControl(d.device)}
                                            title="Control por Segmentos"
                                        >
                                            <Layers size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={styles.manageBtn}
                                onClick={() => setIsEditingDevices(true)}
                            >
                                <Settings size={14} className="mr-2" /> Gestionar Dispositivos
                            </Button>
                        )}
                    </div>
                </>
            ) : (
                <div className={styles.section}>
                    <div className="flex justify-between items-center mb-2">
                        <span className={styles.sublabel}>Seleccionar dispositivos:</span>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingDevices(false)}>
                            <Check size={16} /> Listo
                        </Button>
                    </div>
                    <div className={styles.deviceSelector}>
                        {allDevices.map(device => {
                            const isSelected = group.deviceIds.includes(device.device);
                            return (
                                <div
                                    key={device.device}
                                    className={styles.selectorItem}
                                    onClick={() => toggleDevice(device.device)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                    />
                                    <div className={styles.selectorInfo}>
                                        <span className={styles.selectorName}>{device.deviceName}</span>
                                        <span className={styles.selectorModel}>{device.model}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {allDevices.length === 0 && (
                            <div className="p-4 text-center text-sm text-gray-400">
                                No se encontraron dispositivos disponibles
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsEditingDevices(false)}
                    >
                        Volver al control
                    </Button>
                </div>
            )}

            {showSegmentControl && (() => {
                const device = groupDevices.find(d => d.device === showSegmentControl);
                const markerWithSegments = plans
                    .flatMap(p => p.markers)
                    .find(m => m.deviceId === showSegmentControl && m.segments);

                return (
                    <SegmentControl
                        deviceName={device?.deviceName || 'Dispositivo'}
                        initialSegments={markerWithSegments?.segments}
                        onClose={() => setShowSegmentControl(null)}
                        onApply={async (segments) => {
                            if (device) {
                                try {
                                    await controlSegmented(device.device, device.model, segments);

                                    // persist segments universally across ALL plans and markers
                                    updateDeviceSegments(device.device, segments);

                                    setShowSegmentControl(null);
                                } catch (error) {
                                    alert('Error al aplicar iluminación por segmentos');
                                }
                            }
                        }}
                    />
                );
            })()}
        </div>
    );
};
