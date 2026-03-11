import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { QueryProvider } from '@/lib/query/QueryProvider';
import './globals.css';

const heading = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://assets.tcgdex.net" />
        <link rel="preconnect" href="https://assets.tcgdex.net" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${heading.variable} ${body.variable} font-body bg-background text-foreground antialiased`}
      >
        <div className="grain" />
        <QueryProvider>
          <Navbar />
          <main className="relative">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
