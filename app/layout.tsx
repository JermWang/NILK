import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from "@/components/layout/Navbar";
import StarBackground from "@/app/components/layout/StarBackground";
import MusicWidget from "@/app/components/layout/MusicWidget";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Configure Oswald font
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Specify weights you might use
  variable: '--font-oswald',
})

export const metadata: Metadata = {
  title: 'GOT NILK?',
  description: 'Gamified DeFi on Hyperliquid EVM - Farm $NILK with your NFT Cows!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} font-sans dark`} suppressHydrationWarning>
      <body className="bg-gradient-to-br from-black via-green-900 to-black">
        <StarBackground />
        <MusicWidget />
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
