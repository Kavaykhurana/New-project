import type { Metadata } from 'next';
import './globals.css';
import '@fontsource-variable/sora';

export const metadata: Metadata = {
  title: 'Snake',
  description: 'Classic Snake game built with Next.js.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
