import './globals.css'

export const metadata = {
  title: 'FlytBase Mission Platform',
  description: 'Distributed mission-orchestration platform for autonomous drones',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

