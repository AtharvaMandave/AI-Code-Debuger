import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ClientLayout from '../components/ClientLayout'
import Navbar from '../components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'AI Debugger - Smart Code Analysis & Debugging',
  description: 'Transform your debugging experience with AI-powered code analysis, interactive visualizations, and intelligent insights.',
  keywords: 'AI debugging, code analysis, bug detection, programming tools, developer tools',
  authors: [{ name: 'AI Debugger Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ClientLayout>
        <html lang="en" className="scroll-smooth">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </body>
        </html>
      </ClientLayout>
    </ClerkProvider>
  )
}
