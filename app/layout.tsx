import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'PokéPacks — Collect. Open. Discover.',
  description:
    'Open Pokemon card packs with real pull rates. Build your collection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${outfit.variable} font-[var(--font-body)] bg-background text-foreground antialiased`}
      >
        <div className="relative min-h-screen bg-dot-grid">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
