import React from 'react';
import styles from './Slider.module.css';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCommit?: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, className = '', onCommit, onChange, ...props }) => {

    const handleMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        if (onCommit) {
            // value is in e.currentTarget.value
            onCommit(Number(e.currentTarget.value));
        }
    };

    return (
        <div className={`${styles.container} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                type="range"
                className={styles.slider}
                onChange={onChange}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                {...props}
            />
        </div>
    );
};
