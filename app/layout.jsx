import './globals.css';

export const metadata = {
  title: 'KhmerDubStudio - AI Video Dubbing Studio',
  description: 'AI Video Dubbing Desktop Application for Khmer Language',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Kantumruy+Pro:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f6f5f0] text-zinc-900 font-sans antialiased h-screen flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
