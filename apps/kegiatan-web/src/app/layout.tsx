import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Kegiatan GKJ Jakarta',
  description: 'Perencanaan program kerja dan anggaran UPK GKJ Jakarta',
  robots: { index: false, follow: false },
  icons: { icon: '/logo-gkj.jpg', apple: '/logo-gkj.jpg' },
}

export const viewport: Viewport = { themeColor: '#1e3a5f', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
