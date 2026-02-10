'use client';

import React, { useEffect } from 'react';
import { GoveeDevice, controlDevice } from '@/lib/govee';
import styles from './DeviceControlPanel.module.css';
import { ColorPicker } from './ColorPicker';
import { ScenePicker } from './ScenePicker';
import { Button } from './ui/Button';
import { Power, Sun, Palette, Sparkles } from 'lucide-react';
import { useDevices } from '@/context/DeviceContext';

interface DeviceControlPanelProps {
    device: GoveeDevice;
    onClose: () => void;
}

const BRIGHTNESS_STEPS = [20, 40, 60, 80, 100];

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({ device, onClose }) => {
    const { updateDeviceState } = useDevices();
    const [brightness, setBrightness] = React.useState(device.properties?.brightness || 100);
    const [color, setColor] = React.useState(device.properties?.color || { r: 255, g: 255, b: 255 });

    // Sync local state with device state when it changes externally
    useEffect(() => {
        if (device.properties?.brightness !== undefined) {
            setBrightness(device.properties.brightness);
        }
    }, [device.properties?.brightness]);

    const handlePowerToggle = async () => {
        const newState = device.properties?.powerState === 'on' ? 'off' : 'on';
        // Optimistic update
        updateDeviceState(device.device, { powerState: newState });
        try {
            await controlDevice(device.device, device.model, {
                name: 'turn',
                value: newState
            });
        } catch (error) {
            // Revert on error
            updateDeviceState(device.device, { powerState: device.properties?.powerState });
            console.error(error);
        }
    };

    // DIRECT COMMIT for Buttons
    const handleBrightnessSet = async (val: number) => {
        setBrightness(val); // Update visual immediately
        console.log('Setting brightness:', val);
        updateDeviceState(device.device, { brightness: val });
        try {
            await controlDevice(device.device, device.model, {
                name: 'brightness',
                value: val
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleColorChange = async (newColor: { r: number; g: number; b: number }) => {
        setColor(newColor);
        updateDeviceState(device.device, { color: newColor });
        try {
            await controlDevice(device.device, device.model, {
                name: 'color',
                value: newColor
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSceneChange = async (sceneId: string) => {
        // Optimistically we could update state if we had a specific scene property
        // For now, let's just send the command
        try {
            await controlDevice(device.device, device.model, {
                name: 'scene',
                value: sceneId
            });
        } catch (error) {
            console.error('Error setting scene:', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>{device.deviceName}</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </div>

            <div className={styles.controls}>
                <div className={styles.section}>
                    <div className={styles.label}>
                        <Power size={18} />
                        <span>Encendido</span>
                    </div>
                    <Button
                        variant={device.properties?.powerState === 'on' ? 'primary' : 'secondary'}
                        onClick={handlePowerToggle}
                    >
                        {device.properties?.powerState === 'on' ? 'ENCENDIDO' : 'APAGADO'}
                    </Button>
                </div>

                <div className={styles.section}>
                    <div className={styles.label}>
                        <Sun size={18} />
                        <span>Brillo ({brightness}%)</span>
                    </div>
                    <div className={styles.brightnessGrid}>
                        {BRIGHTNESS_STEPS.map((step) => {
                            const isSelected = Math.abs(brightness - step) <= 10;

                            return (
                                <button
                                    key={step}
                                    className={`${styles.brightnessBox} ${isSelected ? styles.brightnessBoxActive : ''}`}
                                    onClick={() => handleBrightnessSet(step)}
                                >
                                    {step}%
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.label}>
                        <Palette size={18} />
                        <span>Color</span>
                    </div>
                    <ColorPicker color={color} onChange={handleColorChange} />
                </div>

                <div className={styles.section}>
                    <div className={styles.label}>
                        <Sparkles size={18} />
                        <span>Estilos Predeterminados</span>
                    </div>
                    <ScenePicker onSceneSelect={handleSceneChange} />
                </div>
            </div>
        </div>
    );
};
