import { NextResponse } from 'next/server';
import { getDeviceState } from '@/lib/govee';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const device = searchParams.get('device');
    const model = searchParams.get('model');

    if (!device || !model) {
        return NextResponse.json({ error: 'Missing device or model' }, { status: 400 });
    }

    const state = await getDeviceState(device, model);
    return NextResponse.json(state);
}

// Optional: Batch state fetcher
export async function POST(request: Request) {
    try {
        const { devices } = await request.json();
        if (!Array.isArray(devices)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // We use Promise.all to fetch states concurrently.
        // NOTE: Govee rate limits might be an issue if many devices are fetched at once.
        const stateResults = [];
        for (const d of devices) {
            try {
                const state = await getDeviceState(d.device, d.model);
                stateResults.push({ device: d.device, properties: state });
                // Small delay to avoid bursting the API if cache miss
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error: any) {
                if (error.status === 429) {
                    return NextResponse.json({ error: 'Too Many Requests', retryAfter: 60 }, { status: 429 });
                }
                console.error(`Error fetching state for ${d.device}:`, error);
                // Continue with other devices for non-429 errors
                stateResults.push({ device: d.device, properties: null });
            }
        }

        return NextResponse.json(stateResults);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
