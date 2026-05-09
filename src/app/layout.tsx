import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codeforces AI Tutor',
  description: 'AI-powered coaching for competitive programming',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
