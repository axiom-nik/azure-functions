'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

// Available intervals in minutes
const INTERVAL_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 1800, label: '30 minutes' },
];

interface ApiMetadata {
  fetchTimestamp: string;
  region: string;
}

interface ExcelInfo {
  filename: string;
  total_records: number;
  filtered_records: number;
  buffer: string;
}

export default function JobDivaAPI() {
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>('Never');
  const [nextFetchIn, setNextFetchIn] = useState<number>(60);
  const [metadata, setMetadata] = useState<ApiMetadata | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<number>(60);
  const [excelInfo, setExcelInfo] = useState<ExcelInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const fetchJobDivaData = async () => {
    try {
      console.log('API call initiated');
      setIsLoading(true);
      setError(null);
      setUploadStatus('idle');
      
      const response = await fetch('/api/jobdiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ region: 'USA' }),
      });

      console.log('API call completed');

      // Get timestamps from headers
      const headerTimestamp = response.headers.get('X-Fetch-Time-Formatted');
      const data = await response.json();
      
      setApiResponse(JSON.stringify(data.data, null, 2));
      setLastFetchTime(headerTimestamp || new Date().toLocaleString());
      setMetadata(data.metadata);
      setExcelInfo(data.excel);

      // Create and upload Excel immediately
      if (data.excel?.buffer && !isUploading) {
        console.log('Creating and uploading Excel to SharePoint');
        await handleUploadToSharePoint();
      }
      
      // Reset countdown after successful fetch
      setNextFetchIn(selectedInterval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadToSharePoint = async () => {
    if (!excelInfo?.buffer) {
      setError('No Excel file available to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadStatus('idle');

      const response = await fetch('/api/sharepoint/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: excelInfo.buffer,
          filename: excelInfo.filename,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to SharePoint');
      }

      setUploadStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload to SharePoint');
      setUploadStatus('failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadJsonToSharePoint = async () => {
    if (!apiResponse) {
      setError('No API response available to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadStatus('idle');

      // Convert JSON string to Uint8Array
      const uint8Array = new TextEncoder().encode(apiResponse);
      // Convert Uint8Array to Base64
      const base64Data = Buffer.from(uint8Array).toString('base64');

      const response = await fetch('/api/sharepoint/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          filename: 'L2Selected.json',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to SharePoint');
      }

      setUploadStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload to SharePoint');
      setUploadStatus('failed');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let fetchIntervalId: NodeJS.Timeout;
    let countdownIntervalId: NodeJS.Timeout;

    if (isRunning) {
      // Fetch data immediately when starting
      fetchJobDivaData();

      // Set up timer to fetch and upload every interval
      fetchIntervalId = setInterval(async () => {
        console.log('Timer triggered');
        await fetchJobDivaData();
        if (excelInfo?.buffer && !isUploading) {
          console.log('Attempting to upload to SharePoint');
          await handleUploadToSharePoint();
        }
      }, selectedInterval * 1000);

      // Set up countdown timer that updates every second
      countdownIntervalId = setInterval(() => {
        setNextFetchIn(prev => {
          if (prev <= 1) {
            return selectedInterval;
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
  }, [isRunning, selectedInterval]); // Effect runs when isRunning or selectedInterval changes

  useEffect(() => {
    document.title = 'L2 Selected API';
  }, []);

  // Format the countdown time
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setNextFetchIn(selectedInterval);
  };

  const handleStop = () => {
    setIsRunning(false);
    setNextFetchIn(selectedInterval);
  };

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(event.target.value);
    setSelectedInterval(newInterval);
    if (isRunning) {
      setNextFetchIn(newInterval);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>JobDiva L2 Selected</h1>
      
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
          <select 
            value={selectedInterval}
            onChange={handleIntervalChange}
            disabled={isRunning}
            className={styles.intervalSelect}
          >
            {INTERVAL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleUploadToSharePoint}
            disabled={!excelInfo?.buffer || isUploading}
            className={`${styles.button} ${styles.uploadButton}`}
          >
            {isUploading ? 'Uploading...' : 'Upload to SharePoint'}
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
          {excelInfo && (
            <div className={styles.excelInfo}>
              <div>Excel File: {excelInfo.filename}</div>
              <div>Total Records: {excelInfo.total_records}</div>
              <div>Filtered Records: {excelInfo.filtered_records}</div>
              {uploadStatus !== 'idle' && (
                <div className={`${styles.uploadStatus} ${styles[uploadStatus]}`}>
                  SharePoint Upload: {uploadStatus}
                </div>
              )}
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
          <h2>Filtered JSON Data:</h2>
          <pre className={styles.response}>
            {apiResponse}
          </pre>
        </div>
      )}
    </main>
  );
} 