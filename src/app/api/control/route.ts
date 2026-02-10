import { NextResponse } from 'next/server';

const GOVEE_API_KEY = '5dff8aa3-4c60-48d2-b719-a72f81ca6ef9';
const BASE_URL_V1 = 'https://developer-api.govee.com/v1';
const BASE_URL_OPEN = 'https://openapi.api.govee.com/router/api/v1';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { device, model, cmd, capability, version } = body;

        // Determine which API to use
        const isNewApi = version === 'v2' || !!capability;
        const url = isNewApi
            ? `${BASE_URL_OPEN}/device/control`
            : `${BASE_URL_V1}/devices/control`;

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
            // Validate v1 body
            if (!device || !model || !cmd) {
                return NextResponse.json(
                    { error: 'Missing required fields: device, model, cmd' },
                    { status: 400 }
                );
            }
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
            const errorText = await response.text();
            console.error(`Govee ${isNewApi ? 'Open' : 'V1'} API Error:`, errorText);
            return NextResponse.json(
                { error: `Govee API error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
