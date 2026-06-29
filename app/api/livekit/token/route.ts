import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const username = req.nextUrl.searchParams.get('username');

    if (!room) {
        return NextResponse.json({ error: 'Missing room parameter' }, { status: 400 });
    }
    if (!username) {
        return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json(
            { error: 'Server is missing LiveKit environment configurations' },
            { status: 500 }
        );
    }

    try {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: username,
        });

        at.addGrant({
            roomJoin: true,
            room: room,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();
        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
