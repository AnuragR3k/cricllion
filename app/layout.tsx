import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Press_Start_2P } from 'next/font/google'
import './globals.css'

const pixel = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
})

const upheaval = localFont({
  src: './fonts/upheavtt.ttf',
  variable: '--font-upheaval',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cricllion: the daily cricket dive',
  description:
    'Seven cricket questions. Twenty-five seconds each. The rarer your answer, the deeper it goes.',
}

export const viewport: Viewport = {
  themeColor: '#06110c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${upheaval.variable}`}>
      <body>{children}</body>
    </html>
  )
}
