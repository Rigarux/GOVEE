import React from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
    color: { r: number; g: number; b: number };
    onChange: (color: { r: number; g: number; b: number }) => void;
}

const PRESET_COLORS = [
    { r: 255, g: 0, b: 0 },    // Red
    { r: 0, g: 255, b: 0 },    // Green
    { r: 0, g: 0, b: 255 },    // Blue
    { r: 255, g: 255, b: 0 },  // Yellow
    { r: 0, g: 255, b: 255 },  // Cyan
    { r: 255, g: 0, b: 255 },  // Magenta
    { r: 255, g: 255, b: 255 },// White
    { r: 255, g: 140, b: 0 },  // Orange
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        onChange({ r, g, b });
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    return (
        <div className={styles.container}>
            <label className={styles.label}>Color</label>
            <div className={styles.presets}>
                {PRESET_COLORS.map((preset, idx) => (
                    <button
                        key={idx}
                        className={styles.presetBtn}
                        style={{ backgroundColor: `rgb(${preset.r},${preset.g},${preset.b})` }}
                        onClick={() => onChange(preset)}
                    />
                ))}
            </div>
            <div className={styles.custom}>
                <input
                    type="color"
                    value={rgbToHex(color.r, color.g, color.b)}
                    onChange={handleChange}
                    className={styles.input}
                />
                <span className={styles.hex}>{rgbToHex(color.r, color.g, color.b)}</span>
            </div>
        </div>
    );
};
