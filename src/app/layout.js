import { ClerkProvider } from '@clerk/nextjs';
import { geistSans, geistMono } from '@/lib/fonts';
import ClientLayout from '@/components/ClientLayout';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 min-h-screen`}>
        <ClerkProvider>
          <ClientLayout>{children}</ClientLayout>
        </ClerkProvider>
      </body>
    </html>
  );
} 