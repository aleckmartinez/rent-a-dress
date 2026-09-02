import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atelier Dress Rental — Admin & Public Availability',
  description: 'Production-ready dress rental management system and public availability catalog.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full bg-[#faf9f6] text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
