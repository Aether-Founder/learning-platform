import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { I18nProvider } from '@/components/I18nProvider';

import { InitialLoader } from '@/components/InitialLoader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aether',
  description:
    'Aether is het studieplatform voor VWO en HAVO: studiesets, lessen, agenda en oefenvoortgang per vak op één plek.',
  icons: {
    icon: '/aether-logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1d2e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning style={{ backgroundColor: '#1a1d2e' }}>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background-color: #1a1d2e !important;
            }
            .logo-wrapper {
              position: relative;
              width: 120px;
              height: 120px;
            }
            .logo-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .reflection-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              -webkit-mask-image: url(/aether-logo.png);
              -webkit-mask-size: contain;
              -webkit-mask-position: center;
              -webkit-mask-repeat: no-repeat;
              mask-image: url(/aether-logo.png);
              mask-size: contain;
              mask-position: center;
              mask-repeat: no-repeat;
              overflow: hidden;
            }
            .reflection-line {
              position: absolute;
              width: 200%;
              height: 200%;
              top: -50%;
              left: -50%;
              background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 60%);
              background-size: 100% 100%;
              animation: reflection 3s ease-in-out infinite;
            }
            @keyframes reflection {
              0% {
                transform: translate(-100%, -100%);
              }
              100% {
                transform: translate(100%, 100%);
              }
            }
          `
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable}`} style={{ backgroundColor: '#1a1d2e' }} suppressHydrationWarning>
        <InitialLoader />
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>{children}</I18nProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

