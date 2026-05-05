import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-6">
          <nav className="mb-6 flex gap-4 text-sm">
            <Link href="/">Home</Link><Link href="/dashboard">Dashboard</Link><Link href="/projects">Projects</Link><Link href="/suppliers">Suppliers</Link><Link href="/plants">Plants</Link><Link href="/logs">Daily Logs</Link>
            <span className="text-slate-400">IPC (coming soon)</span>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
