import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif']
})

export const metadata: Metadata = {
  title: 'LexAssist AI - Legal Research Assistant',
  description: 'Comprehensive legal research assistant for Indian Criminal Law and Corporate Law',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}>
        <IframeLoggerInit />
        {children}
      </body>
    </html>
  )
}
