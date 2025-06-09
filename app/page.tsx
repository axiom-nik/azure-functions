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
  const [isRunning, setIsRunning] = useState(false);

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
    let fetchIntervalId: NodeJS.Timeout;
    let countdownIntervalId: NodeJS.Timeout;

    if (isRunning) {
      // Fetch data immediately when starting
      fetchJobDivaData();

      // Set up timer to fetch every interval
      fetchIntervalId = setInterval(fetchJobDivaData, FETCH_INTERVAL);

      // Set up countdown timer that updates every second
      countdownIntervalId = setInterval(() => {
        setNextFetchIn(prev => {
          if (prev <= 1) {
            return FETCH_INTERVAL / 1000;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup intervals on component unmount or when stopping
    return () => {
      if (fetchIntervalId) clearInterval(fetchIntervalId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
    };
  }, [isRunning]); // Effect runs when isRunning changes

  // Format the countdown time
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setNextFetchIn(FETCH_INTERVAL / 1000);
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>JobDiva API Tester</h1>
      
      <div className={styles.controls}>
        <div className={styles.buttonGroup}>
          <button 
            onClick={handleStart}
            disabled={isRunning || isLoading}
            className={`${styles.button} ${styles.startButton}`}
          >
            Start
          </button>
          <button 
            onClick={handleStop}
            disabled={!isRunning}
            className={`${styles.button} ${styles.stopButton}`}
          >
            Stop
          </button>
          <button 
            onClick={fetchJobDivaData}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Fetching...' : 'Fetch Now'}
          </button>
        </div>
        <div className={styles.status}>
          <div className={styles.lastFetch}>
            Last fetched: {lastFetchTime}
          </div>
          {isRunning && (
            <div className={styles.nextFetch}>
              Next fetch in: {formatCountdown(nextFetchIn)}
            </div>
          )}
          {metadata && (
            <div className={styles.metadata}>
              <div>Region: {metadata.region}</div>
              <div>Server timestamp: {new Date(metadata.fetchTimestamp).toLocaleString()}</div>
            </div>
          )}
        </div>
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