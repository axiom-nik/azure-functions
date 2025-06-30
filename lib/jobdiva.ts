interface JobDivaCredentials {
  username: string;
  password: string;
  clientId: string;
}

interface JobDivaResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type JobDivaRegion = 'USA' | 'INDIA';

export class JobDivaService {
  private baseUrl: string;
  private credentials: JobDivaCredentials;
  private region: JobDivaRegion;
  private token: string | null = null;

  constructor(region: JobDivaRegion = 'INDIA') {
    this.baseUrl = 'https://api.jobdiva.com';
    this.region = region;
    
    // Load environment variables directly
    const envVars = {
      JOBDIVA_USERNAME_INDIA: process.env.JOBDIVA_USERNAME_INDIA,
      JOBDIVA_PASSWORD_INDIA: 'JD@pi@cce$$9', // Hardcoded for testing
      JOBDIVA_CLIENT_ID_INDIA: process.env.JOBDIVA_CLIENT_ID_INDIA,
    };
    
    console.log('Environment variables available:', {
      ...envVars,
      JOBDIVA_PASSWORD_INDIA: envVars.JOBDIVA_PASSWORD_INDIA ? '***' : undefined
    });
    
    // Set credentials based on region
    if (region === 'USA') {
      this.credentials = {
        username: process.env.JOBDIVA_USERNAME_USA || '',
        password: process.env.JOBDIVA_PASSWORD_USA || '',
        clientId: process.env.JOBDIVA_CLIENT_ID_USA || '',
      };
    } else {
      this.credentials = {
        username: envVars.JOBDIVA_USERNAME_INDIA || '',
        password: envVars.JOBDIVA_PASSWORD_INDIA || '',
        clientId: envVars.JOBDIVA_CLIENT_ID_INDIA || '',
      };
    }

    // Validate credentials
    if (!this.credentials.username || !this.credentials.password || !this.credentials.clientId) {
      throw new Error(`JobDiva credentials not found in environment variables for ${region} region`);
    }
  }

  private async authenticate(): Promise<string> {
    // Use the password as is, without any encoding
    const url = `${this.baseUrl}/apiv2/authenticate?clientid=${this.credentials.clientId}&username=${encodeURIComponent(this.credentials.username)}&password=${this.credentials.password}`;
    console.log('Authenticating with JobDiva (password length):', this.credentials.password.length);
    console.log('Authenticating with JobDiva:', url);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { 
      method: 'GET',
      headers
    });
    console.log('Auth response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Auth failed:', errorBody);
      throw new Error(`Auth failed: ${response.statusText} - ${errorBody}`);
    }
    
    const token = await response.text();
    console.log('Received auth token');
    this.token = token;
    return token;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<JobDivaResponse<T>> {
    try {
      // Authenticate if we don't have a token yet
      if (!this.token) {
        await this.authenticate();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': this.token as string,
      };

      const url = `${this.baseUrl}${endpoint}`;
      console.log('Making JobDiva API request:', {
        url,
        method,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        body
      });

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log('JobDiva API response status:', response.status);
      const responseText = await response.text();
      console.log('JobDiva API response body:', responseText);

      if (!response.ok) {
        throw new Error(`JobDiva API error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        // Add timestamp to the data if it's an object
        if (typeof data === 'object' && data !== null) {
          data.message = `${data.message || 'Query completed successfully'} at ${new Date().toLocaleString()}`;
        }
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        data = responseText;
      }

      return { success: true, data };
    } catch (error) {
      console.error('JobDiva API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async fetchInitialData() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const toDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const fromDate = `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`;

    return this.makeRequest(`/apiv2/bi/NewUpdatedSubmittalInterviewHireActivityRecords?fromDate=${fromDate}&toDate=${toDate}&userFieldsName=L1 Interview Status,L2 Interview Status`, 'GET');
  }

  async fetchJobDetail(jobId: string) {
    return this.makeRequest(`/apiv2/bi/JobDetail?jobId=${jobId}`, 'GET');
  }
} 