'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();

  const navigateToJobDiva = () => {
    router.push('/jobdiva');
  };

  const navigateToCandidateForm = () => {
    router.push('/candidate-form');
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Welcome to the Axiom BGV Dashboard</h1>
      <p>Navigate to different services from here.</p>
      <button className={styles.button} onClick={navigateToJobDiva}>
        Go to JobDiva API
      </button>
      <button className={styles.button} onClick={navigateToCandidateForm}>
        Go to Candidate Form
      </button>
    </main>
  );
} 