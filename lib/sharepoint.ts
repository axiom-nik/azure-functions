import { ConfidentialClientApplication } from '@azure/msal-node';

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const TENANT_ID = process.env.TENANT_ID;
const SITE_ID = process.env.SITE_ID;
const DRIVE_ID = process.env.DRIVE_ID;
const SHAREPOINT_FOLDER = process.env.SHAREPOINT_FOLDER;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

function validateEnvironmentVariables() {
  if (!CLIENT_ID || !TENANT_ID || !SITE_ID || !DRIVE_ID || !SHAREPOINT_FOLDER || !CLIENT_SECRET) {
    console.error('Missing SharePoint environment variables:', {
      CLIENT_ID: !!CLIENT_ID,
      TENANT_ID: !!TENANT_ID,
      SITE_ID: !!SITE_ID,
      DRIVE_ID: !!DRIVE_ID,
      SHAREPOINT_FOLDER: !!SHAREPOINT_FOLDER,
      CLIENT_SECRET: !!CLIENT_SECRET
    });
    throw new Error('Missing required SharePoint environment variables');
  }
}

// Initialize MSAL client after validation
let msalClient: ConfidentialClientApplication;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    validateEnvironmentVariables();
    const msalConfig = {
      auth: {
        clientId: CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${TENANT_ID!}`,
        clientSecret: CLIENT_SECRET!,
      }
    };
    msalClient = new ConfidentialClientApplication(msalConfig);
  }
  return msalClient;
}

export async function get_access_token(): Promise<string> {
  try {
    const client = getMsalClient();
    
    console.log('Getting access token with config:', {
      clientId: CLIENT_ID,
      tenantId: TENANT_ID,
      hasClientSecret: !!CLIENT_SECRET
    });

    const result = await client.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!result?.accessToken) {
      console.error('No access token in result:', result);
      throw new Error('Failed to get access token');
    }

    console.log('Successfully obtained access token');
    return result.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export async function upload_file_to_sharepoint(
  accessToken: string,
  base64Data: string,
  filename: string
): Promise<boolean> {
  try {
    validateEnvironmentVariables();
    
    console.log('🔍 Starting SharePoint upload process...');
    console.log('📁 File details:', { filename, size: base64Data.length });

    // Step 1: Verify site access
    console.log('🔑 Step 1: Verifying site access...');
    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}`;
    console.log('   Site URL:', siteUrl);

    const siteResponse = await fetch(siteUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      console.error('❌ Failed to access site:', errorText);
      return false;
    }
    console.log('✅ Site access verified successfully');

    // Step 2: Verify drive access
    console.log('🔑 Step 2: Verifying drive access...');
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root/children`;
    console.log('   Drive URL:', driveUrl);

    const driveResponse = await fetch(driveUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!driveResponse.ok) {
      const errorText = await driveResponse.text();
      console.error('❌ Failed to access drive:', errorText);
      return false;
    }
    console.log('✅ Drive access verified successfully');

    // Step 3: Try uploading to root as a test
    console.log('🔑 Step 3: Testing upload to root...');
    const testUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root:/${filename}:/content`;
    console.log('   Test URL:', testUrl);

    // Decode base64 data to binary
    const fileData = Buffer.from(base64Data, 'base64');
    console.log('   File size:', fileData.length, 'bytes');

    const testResponse = await fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': fileData.length.toString(),
        'Accept': 'application/json'
      },
      body: fileData
    });

    if (testResponse.ok) {
      console.log('✅ Test upload successful');
      return true;
    }
    console.log('⚠️ Test upload failed, trying full path...');

    // Step 4: Try full path with encoded folder
    console.log('🔑 Step 4: Attempting upload to full path...');
    const encodedPath = encodeURIComponent(`${SHAREPOINT_FOLDER}/${filename}`);
    const createUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root:/${encodedPath}`;
    console.log('   Create URL:', createUrl);

    const createResponse = await fetch(createUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "@microsoft.graph.conflictBehavior": "replace"
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Failed to create file:', errorText);
      return false;
    }
    console.log('✅ File metadata created successfully');

    // Step 5: Upload content
    console.log('🔑 Step 5: Uploading file content...');
    const uploadUrl = `${createUrl}:/content`;
    console.log('   Upload URL:', uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': fileData.length.toString(),
        'Accept': 'application/json'
      },
      body: fileData
    });

    if (uploadResponse.ok) {
      console.log('✅ Upload successful');
      return true;
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status);
      console.error('Error details:', errorText);
      
      // Log the request details for debugging
      console.error('Request details:', {
        url: uploadUrl,
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Length': fileData.length.toString(),
          'Accept': 'application/json'
        },
        bodySize: fileData.length
      });

      // Try to get more detailed error information
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.innerError) {
          console.error('Inner error details:', errorJson.error.innerError);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error in SharePoint upload process:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return false;
  }
} 