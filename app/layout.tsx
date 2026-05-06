import './globals.css';
import { AuthShell } from '@/components/auth-shell';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <div className='mx-auto max-w-6xl p-6'>
          <AuthShell>{children}</AuthShell>
        </div>
      </body>
    </html>
  );
}
