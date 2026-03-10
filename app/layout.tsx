import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'PokePacks',
  description:
    'Open Pokemon card packs with real pull rates. Build your collection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} font-sans bg-background text-foreground antialiased`}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
