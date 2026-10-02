import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();
const API_KEY = process.env.BOT_API_KEY;

export async function POST(req) {
    if (req.headers.get('x-api-key') !== API_KEY) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await redis.set('bot:status', JSON.stringify({
        ...body,
        lastHeartbeat: Date.now()
    }), { ex: 120 });
    return NextResponse.json({ ok: true });
}

export async function GET(req) {
    const url = new URL(req.url);
    if (url.searchParams.get('key') !== API_KEY) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const status = await redis.get('bot:status');
    if (!status) return NextResponse.json({ online: false });
    const parsed = typeof status === 'string' ? JSON.parse(status) : status;
    const online = Date.now() - parsed.lastHeartbeat < 60000;
    return NextResponse.json({ online, ...parsed });
}
