import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();
const API_KEY = process.env.BOT_API_KEY;

function checkAuth(req) {
    return req.headers.get('x-api-key') === API_KEY;
}

// POST — bot lapor hasil / dashboard kirim command baru
export async function POST(req) {
    if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json();

    if (body.type === 'result') {
        await redis.set(`bot:result:${body.id}`, JSON.stringify({
            result: body.result,
            finishedAt: Date.now()
        }), { ex: 600 });
        return NextResponse.json({ ok: true });
    }

    if (body.type === 'command') {
        const id = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await redis.lpush('bot:commands:queue', JSON.stringify({
            id,
            command: body.command,
            args: body.args || '',
            chatId: body.chatId || null,
            createdAt: Date.now()
        }));
        return NextResponse.json({ ok: true, id });
    }

    return NextResponse.json({ error: 'unknown type' }, { status: 400 });
}

// GET — bot ambil command dari queue
export async function GET(req) {
    if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const cmd = await redis.rpop('bot:commands:queue');
    if (!cmd) return NextResponse.json({ command: null });
    return NextResponse.json(typeof cmd === 'string' ? JSON.parse(cmd) : cmd);
}
