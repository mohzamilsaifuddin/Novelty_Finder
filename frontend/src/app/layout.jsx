import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: { default: 'Novelty Finder', template: '%s | Novelty Finder' },
  description: 'Sistem monitoring jurnal ilmiah untuk menemukan research gap dan novelty penelitian',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
