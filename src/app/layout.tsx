import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SafePath AI — Emergency Response System',
  description: 'Multi-agent disaster response and evacuation assistant',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
