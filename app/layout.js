export const metadata = { title: 'Bot Dashboard' };
export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#fff' }}>
                {children}
            </body>
        </html>
    );
}
