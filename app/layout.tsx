import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InfluencerFlow - Connect Brands with Creators',
  description: 'The ultimate platform for influencer marketing collaborations. Connect brands with creators, manage campaigns, and track performance with AI-powered tools.',
  keywords: ['influencer marketing', 'brand collaboration', 'creator economy', 'social media marketing'],
  authors: [{ name: 'InfluencerFlow Team' }],
  openGraph: {
    title: 'InfluencerFlow - Connect Brands with Creators',
    description: 'The ultimate platform for influencer marketing collaborations.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InfluencerFlow - Connect Brands with Creators',
    description: 'The ultimate platform for influencer marketing collaborations.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
} 