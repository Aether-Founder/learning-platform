import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { I18nProvider } from '@/components/I18nProvider';

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
            #initial-loader {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: #1a1d2e;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              transition: opacity 0.5s ease-out;
            }
            #initial-loader.hidden {
              opacity: 0;
              pointer-events: none;
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
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              let loaderHidden = false;
              window.hideInitialLoader = function() {
                if (loaderHidden) return;
                loaderHidden = true;
                const loader = document.getElementById('initial-loader');
                if (loader) {
                  loader.classList.add('hidden');
                  setTimeout(function() {
                    try {
                      if (loader && loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                      }
                    } catch (e) {
                      // Ignore removeChild errors
                    }
                  }, 500);
                }
              };
              
              // Auto-hide after 5 seconds as fallback
              setTimeout(function() {
                window.hideInitialLoader();
              }, 5000);
            })();
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
        <div id="initial-loader">
          <div className="logo-wrapper">
            <img src="/aether-logo.png" alt="Aether Logo" className="logo-image" />
            <div className="reflection-overlay">
              <div className="reflection-line"></div>
            </div>
          </div>
        </div>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>{children}</I18nProvider>
          </ThemeProvider>
        </SupabaseProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Hide loader when React hydrates
            if (typeof window !== 'undefined' && window.hideInitialLoader) {
              window.hideInitialLoader();
            }
          `
        }} />
      </body>
    </html>
  );
}
