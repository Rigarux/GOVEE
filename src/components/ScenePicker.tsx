'use client';

import React from 'react';
import styles from './ScenePicker.module.css';
import {
    Coffee, Moon, Sun, Wind, Cloud, Waves, Trees, Zap,
    Play, Sparkles, Flame, Film, Utensils, Gamepad2,
    BookOpen, Heart, Siren, Tv
} from 'lucide-react';

interface Scene {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
}

interface SceneCategory {
    name: string;
    scenes: Scene[];
}

const CATEGORIES: SceneCategory[] = [
    {
        name: 'Vida Diaria',
        scenes: [
            { id: 'movie', name: 'Cine', icon: <Film size={18} />, color: '#6366f1' },
            { id: 'dinner', name: 'Cena', icon: <Utensils size={18} />, color: '#f59e0b' },
            { id: 'gaming', name: 'Gaming', icon: <Gamepad2 size={18} />, color: '#ec4899' },
            { id: 'study', name: 'Estudio', icon: <BookOpen size={18} />, color: '#10b981' },
        ]
    },
    {
        name: 'Ambiental',
        scenes: [
            { id: 'reading', name: 'Lectura', icon: <Coffee size={18} />, color: '#fbbf24' },
            { id: 'focus', name: 'Concentración', icon: <Zap size={18} />, color: '#60a5fa' },
            { id: 'night', name: 'Noche', icon: <Moon size={18} />, color: '#818cf8' },
            { id: 'meditation', name: 'Meditación', icon: <Heart size={18} />, color: '#a855f7' },
            { id: 'candles', name: 'Velas', icon: <Flame size={18} />, color: '#f87171' },
        ]
    },
    {
        name: 'Naturaleza',
        scenes: [
            { id: 'sunrise', name: 'Amanecer', icon: <Sun size={18} />, color: '#fb923c' },
            { id: 'sunset', name: 'Atardecer', icon: <Cloud size={18} />, color: '#f472b6' },
            { id: 'ocean', name: 'Océano', icon: <Waves size={18} />, color: '#2dd4bf' },
            { id: 'forest', name: 'Bosque', icon: <Trees size={18} />, color: '#4ade80' },
        ]
    },
    {
        name: 'Dinámico',
        scenes: [
            { id: 'party', name: 'Fiesta', icon: <Sparkles size={18} />, color: '#e879f9' },
            { id: 'fire', name: 'Fuego', icon: <Flame size={18} />, color: '#ef4444' },
            { id: 'police', name: 'Policía', icon: <Siren size={18} />, color: '#3b82f6' },
            { id: 'tv', name: 'TV', icon: <Tv size={18} />, color: '#94a3b8' },
            { id: 'rainbow', name: 'Arcoíris', icon: <Wind size={18} />, color: '#facc15' },
        ]
    }
];

interface ScenePickerProps {
    onSceneSelect: (sceneId: string) => void;
    activeSceneId?: string;
}

export const ScenePicker: React.FC<ScenePickerProps> = ({ onSceneSelect, activeSceneId }) => {
    return (
        <div className={styles.container}>
            {CATEGORIES.map((category) => (
                <div key={category.name} className={styles.categorySection}>
                    <h4 className={styles.categoryTitle}>{category.name}</h4>
                    <div className={styles.sceneGrid}>
                        {category.scenes.map((scene) => (
                            <button
                                key={scene.id}
                                className={`${styles.sceneButton} ${activeSceneId === scene.id ? styles.active : ''}`}
                                onClick={() => onSceneSelect(scene.id)}
                            >
                                <div
                                    className={styles.sceneIcon}
                                    style={{ backgroundColor: `${scene.color}15`, color: scene.color }}
                                >
                                    {scene.icon}
                                </div>
                                <span>{scene.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
