import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono, Press_Start_2P } from 'next/font/google'
import './globals.css'

const pixel = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixel-src',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-mono-src',
  display: 'swap',
})

const upheaval = localFont({
  src: './fonts/upheavtt.ttf',
  variable: '--font-upheaval-src',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Cricllion: the daily cricket dive',
  description:
    'Seven cricket questions a day. Twenty seconds each. The rarer your answer, the deeper it goes.',
}

export const viewport: Viewport = {
  themeColor: '#05070f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${mono.variable} ${upheaval.variable}`}>
      <body>{children}</body>
    </html>
  )
}