import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JobDiva API Tester',
  description: 'Test JobDiva API calls and view responses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <div>
          <nav>
            <ul>
              {/* Navigation links removed */}
            </ul>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
} 