'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// Set to 1 minute for testing (in milliseconds)
const FETCH_INTERVAL = 1 * 60 * 1000;

interface ApiMetadata {
  fetchTimestamp: string;
  region: string;
}

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>('Never');
  const [nextFetchIn, setNextFetchIn] = useState<number>(FETCH_INTERVAL / 1000);
  const [metadata, setMetadata] = useState<ApiMetadata | null>(null);

  const fetchJobDivaData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/jobdiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ region: 'USA' }),
      });

      // Get timestamps from headers
      const headerTimestamp = response.headers.get('X-Fetch-Time-Formatted');
      const data = await response.json();
      
      setApiResponse(JSON.stringify(data.data, null, 2));
      setLastFetchTime(headerTimestamp || new Date().toLocaleString());
      setMetadata(data.metadata);
      
      // Reset countdown after successful fetch
      setNextFetchIn(FETCH_INTERVAL / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately when component mounts
    fetchJobDivaData();

    // Set up timer to fetch every 2 minutes (for testing)
    const fetchIntervalId = setInterval(fetchJobDivaData, FETCH_INTERVAL);

    // Set up countdown timer that updates every second
    const countdownIntervalId = setInterval(() => {
      setNextFetchIn(prev => {
        if (prev <= 1) {
          return FETCH_INTERVAL / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(fetchIntervalId);
      clearInterval(countdownIntervalId);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Format the countdown time
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>JobDiva API Tester</h1>
      
      <div className={styles.controls}>
        <button 
          onClick={fetchJobDivaData}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? 'Fetching...' : 'Fetch JobDiva Data'}
        </button>
        <div className={styles.lastFetch}>
          Last fetched: {lastFetchTime}
        </div>
        <div className={styles.nextFetch}>
          Next fetch in: {formatCountdown(nextFetchIn)}
        </div>
        {metadata && (
          <div className={styles.metadata}>
            <div>Region: {metadata.region}</div>
            <div>Server timestamp: {new Date(metadata.fetchTimestamp).toLocaleString()}</div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}

      {apiResponse && (
        <div className={styles.responseContainer}>
          <h2>API Response:</h2>
          <pre className={styles.response}>
            {apiResponse}
          </pre>
        </div>
      )}
    </main>
  );
} 