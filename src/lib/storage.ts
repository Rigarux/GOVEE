export const STORAGE_KEYS = {
    GROUPS: 'govee_groups',
    FLOOR_PLANS: 'govee_floor_plans',
};

export function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading storage key "${key}":`, error);
        return defaultValue;
    }
}

export function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing storage key "${key}":`, error);
    }
}
