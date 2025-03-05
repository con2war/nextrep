import type { Metadata } from 'next'
import './globals.css'

console.log('CSS should be loading...');

export const metadata: Metadata = {
  title: 'NextRep AI',
  description: 'NextRep AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
