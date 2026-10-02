import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();
const API_KEY = process.env.BOT_API_KEY;

export async function POST(req) {
    if (req.headers.get('x-api-key') !== API_KEY) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const log = body.log;
    if (!log) return NextResponse.json({ ok: false });

    // Simpan ke Redis list (max 200 log)
    await redis.lpush('bot:logs', JSON.stringify({ ...log, createdAt: Date.now() }));
    await redis.ltrim('bot:logs', 0, 199);

    return NextResponse.json({ ok: true });
}

export async function GET(req) {
    const url = new URL(req.url);
    if (url.searchParams.get('key') !== API_KEY) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const raw = await redis.lrange('bot:logs', 0, limit - 1);
    const logs = raw.map(r => typeof r === 'string' ? JSON.parse(r) : r);
    return NextResponse.json({ logs });
}
