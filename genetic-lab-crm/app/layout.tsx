import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Genetic Laboratory CRM', description: 'Customer relationship database for genetic laboratories' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
