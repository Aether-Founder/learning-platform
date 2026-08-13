import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { I18nProvider } from '@/components/I18nProvider';
import LoadingScreen from './loading';

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
          `
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;var lang=(tz==='Europe/Amsterdam'||tz==='Europe/Brussels')?'nl':'en';document.documentElement.lang=lang;}catch(e){document.documentElement.lang='nl';}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable}`} style={{ backgroundColor: '#1a1d2e' }}>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>
              <LoadingScreen />
              {children}
            </I18nProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
