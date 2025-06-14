'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function Dashboard() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Welcome to the Axiom BGV Dashboard</h1>
      <p>Navigate to different services from here.</p>
      <Link href="/jobdiva">
        <button className={styles.button}>Go to JobDiva API</button>
      </Link>
    </main>
  );
} 