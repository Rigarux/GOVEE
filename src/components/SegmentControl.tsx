'use client';

import React, { useState } from 'react';
import styles from './SegmentControl.module.css';
import { ColorPicker } from './ColorPicker';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface Color {
    r: number;
    g: number;
    b: number;
}

interface SegmentControlProps {
    onClose: () => void;
    onApply: (segments: { color: Color; brightness: number }[]) => void;
    initialSegments?: { color: Color; brightness: number }[];
    deviceName: string;
}

export const SegmentControl: React.FC<SegmentControlProps> = ({
    onClose,
    onApply,
    initialSegments,
    deviceName
}) => {
    const [segments, setSegments] = useState<{ color: Color; brightness: number }[]>(
        initialSegments || Array(5).fill({ color: { r: 255, g: 255, b: 255 }, brightness: 100 })
    );
    const [activeIdx, setActiveIdx] = useState(0);

    const handleColorChange = (newColor: Color) => {
        const newSegments = [...segments];
        newSegments[activeIdx] = { ...newSegments[activeIdx], color: newColor };
        setSegments(newSegments);
    };

    const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        const newSegments = [...segments];
        newSegments[activeIdx] = { ...newSegments[activeIdx], brightness: val };
        setSegments(newSegments);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Control por Segmentos: {deviceName}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.segmentBar}>
                    {segments.map((s, idx) => (
                        <div
                            key={idx}
                            className={`${styles.segment} ${activeIdx === idx ? styles.segmentActive : ''}`}
                            style={{ backgroundColor: `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})`, opacity: s.brightness / 100 }}
                            onClick={() => setActiveIdx(idx)}
                        >
                            <span className={styles.segmentLabel}>S{idx + 1}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.controls}>
                    <span className={styles.controlsTitle}>Editando Segmento {activeIdx + 1}</span>

                    <ColorPicker
                        color={segments[activeIdx].color}
                        onChange={handleColorChange}
                    />

                    <div className={styles.brightnessControl}>
                        <label className={styles.controlsTitle}>Brillo Segmento</label>
                        <div className={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={segments[activeIdx].brightness}
                                onChange={handleBrightnessChange}
                                className={styles.slider}
                            />
                            <span className={styles.brightnessValue}>{segments[activeIdx].brightness}%</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button onClick={() => onApply(segments)} size="md" variant="primary">
                        Aplicar a Iluminación
                    </Button>
                </div>
            </div>
        </div>
    );
};
