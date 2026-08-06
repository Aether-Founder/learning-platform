/**
 * Auth Layout
 * 
 * Layout for authentication pages (login, register, reset password)
 * Simple, centered layout without navigation
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authenticatie | Aether',
  description: 'Log in of maak een account aan voor Aether Study Platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
