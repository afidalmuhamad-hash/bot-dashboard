'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const [key, setKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState(null);
    const [cmd, setCmd] = useState('');
    const [arg, setArg] = useState('');
    const [chatId, setChatId] = useState('');
    const [log, setLog] = useState([]);

    useEffect(() => {
        const k = localStorage.getItem('botKey');
        if (k) { setKey(k); setSaved(true); }
    }, []);

    useEffect(() => {
        if (!saved) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/status?key=${key}`);
                const data = await res.json();
                setStatus(data);
            } catch (e) {}
        }, 5000);
        return () => clearInterval(interval);
    }, [saved, key]);

    const saveKey = () => {
        localStorage.setItem('botKey', key);
        setSaved(true);
    };

    const sendCmd = async (command, args = '', cid = '') => {
        try {
            const res = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                body: JSON.stringify({ type: 'command', command, args, chatId: cid })
            });
            const data = await res.json();
            setLog(prev => [`[${new Date().toLocaleTimeString()}] → ${command} ${args}`, ...prev].slice(0, 20));
            if (data.id) {
                // Poll hasil
                let tries = 0;
                const poll = setInterval(async () => {
                    tries++;
                    if (tries > 30) { clearInterval(poll); return; }
                    // Cek via API result... skip, cukup tampil di log
                }, 2000);
            }
        } catch (e) {
            setLog(prev => [`[ERROR] ${e.message}`, ...prev]);
        }
    };

    if (!saved) {
        return (
            <div style={{ padding: 40, maxWidth: 400, margin: '100px auto' }}>
                <h1>🔐 Login Dashboard</h1>
                <p>Masukkan API Key (BOT_API_KEY):</p>
                <input
                    type="password"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 16 }}
                    placeholder="API Key"
                />
                <button onClick={saveKey} style={{ width: '100%', padding: 12, fontSize: 16, cursor: 'pointer' }}>
                    Masuk
                </button>
            </div>
        );
    }

    const online = status?.online;

    return (
        <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1>🤖 Bot Dashboard</h1>
                <button onClick={() => { localStorage.removeItem('botKey'); setSaved(false); }} style={{ padding: '8px 16px' }}>
                    Logout
                </button>
            </div>

            {/* Status */}
            <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2>📊 Status Bot</h2>
                <p style={{ color: online ? '#4ade80' : '#ef4444', fontSize: 20 }}>
                    {online ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </p>
                {status && online && (
                    <div style={{ fontSize: 14, color: '#aaa' }}>
                        <p>Bot: {status.botName}</p>
                        <p>Uptime: {Math.floor(status.uptime || 0)} detik</p>
                        <p>Memory: {Math.round((status.memory?.rss || 0) / 1024 / 1024)} MB</p>
                        <p>Heartbeat: {Math.floor((Date.now() - status.lastHeartbeat) / 1000)}s lalu</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2>⚡ Quick Actions</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => sendCmd('ping')} style={{ padding: 10 }}>🏓 Ping</button>
                    <button onClick={() => sendCmd('restart')} style={{ padding: 10, background: '#f59e0b' }}>🔄 Restart</button>
                    <button onClick={() => sendCmd('stats')} style={{ padding: 10 }}>📊 Stats</button>
                    <button onClick={() => sendCmd('cleartmp')} style={{ padding: 10 }}>🧹 Clear Temp</button>
                </div>
            </div>

            {/* Custom Command */}
            <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2>🎯 Custom Command</h2>
                <select value={cmd} onChange={e => setCmd(e.target.value)} style={{ padding: 10, width: '100%', marginBottom: 10 }}>
                    <option value="">-- Pilih Command --</option>
                    <option value="send">Kirim Pesan (send)</option>
                    <option value="broadcast">Broadcast ke Semua Grup</option>
                    <option value="exec">Shell Exec</option>
                    <option value="restart">Restart Bot</option>
                </select>
                {cmd === 'send' && (
                    <input
                        placeholder="Chat ID (contoh: 628xxx@s.whatsapp.net)"
                        value={chatId}
                        onChange={e => setChatId(e.target.value)}
                        style={{ padding: 10, width: '100%', marginBottom: 10 }}
                    />
                )}
                <textarea
                    placeholder="Isi pesan / command"
                    value={arg}
                    onChange={e => setArg(e.target.value)}
                    style={{ padding: 10, width: '100%', marginBottom: 10, minHeight: 80 }}
                />
                <button onClick={() => sendCmd(cmd, arg, chatId)} style={{ padding: 12, width: '100%' }}>
                    🚀 Kirim Command
                </button>
            </div>

            {/* Log */}
            <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8 }}>
                <h2>📝 Log</h2>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa', maxHeight: 300, overflow: 'auto' }}>
                    {log.length === 0 ? 'Belum ada aktivitas.' : log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
