import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="h-full">
      <body className="h-full bg-[#faf9f6] text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
