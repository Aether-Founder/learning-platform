import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // UI-REFERENCE-2 uses Tailwind v4's @theme tokens. This application
      // remains on Tailwind v3, so expose the same CSS-token utilities here.
      // The relative oklch form preserves both the reference color and v3
      // opacity modifiers such as bg-background/90 and bg-foreground/60.
      colors: {
        background: 'oklch(from var(--background) l c h / <alpha-value>)',
        foreground: 'oklch(from var(--foreground) l c h / <alpha-value>)',
        card: 'oklch(from var(--card) l c h / <alpha-value>)',
        'card-foreground': 'oklch(from var(--card-foreground) l c h / <alpha-value>)',
        popover: 'oklch(from var(--popover) l c h / <alpha-value>)',
        'popover-foreground': 'oklch(from var(--popover-foreground) l c h / <alpha-value>)',
        primary: 'oklch(from var(--primary) l c h / <alpha-value>)',
        'primary-foreground': 'oklch(from var(--primary-foreground) l c h / <alpha-value>)',
        secondary: 'oklch(from var(--secondary) l c h / <alpha-value>)',
        'secondary-foreground': 'oklch(from var(--secondary-foreground) l c h / <alpha-value>)',
        muted: 'oklch(from var(--muted) l c h / <alpha-value>)',
        'muted-foreground': 'oklch(from var(--muted-foreground) l c h / <alpha-value>)',
        accent: 'oklch(from var(--accent) l c h / <alpha-value>)',
        'accent-foreground': 'oklch(from var(--accent-foreground) l c h / <alpha-value>)',
        destructive: 'oklch(from var(--destructive) l c h / <alpha-value>)',
        'destructive-foreground': 'oklch(from var(--destructive-foreground) l c h / <alpha-value>)',
        success: 'oklch(from var(--success) l c h / <alpha-value>)',
        warning: 'oklch(from var(--warning) l c h / <alpha-value>)',
        streak: 'oklch(from var(--streak) l c h / <alpha-value>)',
        border: 'oklch(from var(--border) l c h / <alpha-value>)',
        input: 'oklch(from var(--input) l c h / <alpha-value>)',
        ring: 'oklch(from var(--ring) l c h / <alpha-value>)',
        sidebar: 'oklch(from var(--sidebar) l c h / <alpha-value>)',
        'sidebar-foreground': 'oklch(from var(--sidebar-foreground) l c h / <alpha-value>)',
        'sidebar-primary': 'oklch(from var(--sidebar-primary) l c h / <alpha-value>)',
        'sidebar-primary-foreground':
          'oklch(from var(--sidebar-primary-foreground) l c h / <alpha-value>)',
        'sidebar-accent': 'oklch(from var(--sidebar-accent) l c h / <alpha-value>)',
        'sidebar-accent-foreground':
          'oklch(from var(--sidebar-accent-foreground) l c h / <alpha-value>)',
        'sidebar-border': 'oklch(from var(--sidebar-border) l c h / <alpha-value>)',
        'sidebar-ring': 'oklch(from var(--sidebar-ring) l c h / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
