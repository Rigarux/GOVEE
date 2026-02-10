export const GOVEE_API_KEY = '5dff8aa3-4c60-48d2-b719-a72f81ca6ef9';
export const GOVEE_API_URL = 'https://developer.govee.com/reference/get-you-devices';
// The user provided URL in the prompt is actually the documentation URL. 
// The actual API endpoint for Govee is usually https://developer-api.govee.com/v1/devices
// But let's check the docs if possible, or assume standard v1 path.
// Wait, the prompt says "https://developer.govee.com/reference/get-you-devices".
// I'll stick to the standard Govee API base URL for devices which is widely known:
// GET https://developer-api.govee.com/v1/devices
// PUT https://developer-api.govee.com/v1/devices/control

const BASE_URL = 'https://developer-api.govee.com/v1';
const OPEN_API_URL = 'https://openapi.api.govee.com/router/api/v1';

// In-memory cache for device states
const stateCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export type GoveeDevice = {
    device: string;
    model: string;
    deviceName: string;
    controllable: boolean;
    retrievable: boolean;
    supportCmds: string[];
    properties?: {
        color?: { r: number; g: number; b: number };
        brightness?: number;
        powerState?: 'on' | 'off';
        online?: boolean;
    };
};

export async function getDevices() {
    try {
        const response = await fetch(`${BASE_URL}/devices`, {
            method: 'GET',
            headers: {
                'Govee-API-Key': GOVEE_API_KEY,
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Disable cache to ensure fresh list
        });

        if (!response.ok) {
            throw new Error(`Govee API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data?.devices || [];
    } catch (error) {
        console.error('Failed to fetch Govee devices:', error);
        return [];
    }
}

export async function getDeviceState(device: string, model: string) {
    try {
        // Check cache first
        const cached = stateCache.get(device);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            // console.log(`[Cache Hit] ${device}`);
            return cached.data;
        }

        const response = await fetch(`${BASE_URL}/devices/state?device=${device}&model=${model}`, {
            method: 'GET',
            headers: {
                'Govee-API-Key': GOVEE_API_KEY,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const error: any = new Error(`Govee API error: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        // Govee returns properties in an array for v1
        const props = data.data?.properties || [];

        // Map them to our internal properties object for easier use
        const normalizedProps: any = {};
        props.forEach((p: any) => {
            if (p.powerState !== undefined) normalizedProps.powerState = p.powerState;
            if (p.brightness !== undefined) normalizedProps.brightness = p.brightness;
            if (p.color !== undefined) normalizedProps.color = p.color;
        });

        // Store in cache
        stateCache.set(device, { data: normalizedProps, timestamp: Date.now() });

        return normalizedProps;
    } catch (error) {
        console.error(`Failed to fetch state for ${device}:`, error);
        return null;
    }
}

export async function controlDevice(device: string, model: string, cmd?: { name: string; value: any }, capability?: any) {
    const body = cmd ? { cmd } : { capability };
    // If running in browser, use our API proxy to avoid CORS
    if (typeof window !== 'undefined') {
        try {
            const response = await fetch('/api/control', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...body, device, model }),
            });

            if (!response.ok) {
                throw new Error(`Control Proxy Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to control device via proxy:', error);
            throw error;
        }
    }

    // Server-side logic
    try {
        const isNewApi = !!capability;
        const url = isNewApi ? `${OPEN_API_URL}/device/control` : `${BASE_URL}/devices/control`;

        let requestBody;
        if (isNewApi) {
            requestBody = {
                requestId: crypto.randomUUID(),
                payload: {
                    sku: model,
                    device: device,
                    capability: capability
                }
            };
        } else {
            requestBody = { device, model, cmd };
        }

        const response = await fetch(url, {
            method: isNewApi ? 'POST' : 'PUT',
            headers: {
                'Govee-API-Key': GOVEE_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const body = await response.text();
            console.error('Control failed:', body);
            throw new Error(`Govee control error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to control device:', error);
        throw error;
    }
}

export async function controlSegmented(device: string, model: string, segments: { color: { r: number; g: number; b: number }; brightness: number }[]) {
    // New API Capability format
    const colorCapability = {
        type: 'devices.capabilities.segment_color_setting',
        instance: 'segmentedColorRgb',
        value: segments.map((s, idx) => ({
            index: [idx],
            rgb: (s.color.r << 16) + (s.color.g << 8) + s.color.b
        }))
    };

    const brightnessCapability = {
        type: 'devices.capabilities.segment_color_setting',
        instance: 'segmentedBrightness',
        value: segments.map((s, idx) => ({
            index: [idx],
            value: s.brightness
        }))
    };

    try {
        // Send color via controlDevice which now handles capabilities
        await controlDevice(device, model, undefined, colorCapability);
        // Send brightness via controlDevice which now handles capabilities
        await controlDevice(device, model, undefined, brightnessCapability);
    } catch (error) {
        console.error('Failed to send segmented commands:', error);
        throw error;
    }
}
