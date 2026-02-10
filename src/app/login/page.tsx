'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Clear error when typing
        if (error) setError('');
    }, [username, password]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simple demo credentials
        setTimeout(() => {
            if (username === 'admin' && password === 'intelaf2024') {
                localStorage.setItem('intelaf_auth_token', 'demo-token-' + Date.now());
                localStorage.setItem('intelaf_role', 'admin');
                router.push('/');
            } else if (username === 'user' && password === 'intelaf123') {
                localStorage.setItem('intelaf_auth_token', 'demo-token-' + Date.now());
                localStorage.setItem('intelaf_role', 'user');
                router.push('/');
            } else {
                setError('Usuario o contraseña incorrectos');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <div className={styles.logoPlaceholder}>I</div>
                    <h1 className={styles.title}>Remote Light</h1>
                    <p className={styles.subtitle}>Intelaf S,A - Control de Luces</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            className={styles.input}
                            placeholder="Ingrese su usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className={styles.footer}>
                    &copy; 2024 Intelaf S,A. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
}
