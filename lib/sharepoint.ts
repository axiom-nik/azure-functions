import { ConfidentialClientApplication } from '@azure/msal-node';

// Load environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID;
const DRIVE_ID = process.env.NEXT_PUBLIC_DRIVE_ID;
const SHAREPOINT_FOLDER = process.env.NEXT_PUBLIC_SHAREPOINT_FOLDER;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Validate environment variables
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

// Initialize MSAL client
const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    clientSecret: CLIENT_SECRET,
  }
};

const msalClient = new ConfidentialClientApplication(msalConfig);

export async function get_access_token(): Promise<string> {
  try {
    console.log('Getting access token with config:', {
      clientId: CLIENT_ID,
      tenantId: TENANT_ID,
      hasClientSecret: !!CLIENT_SECRET
    });

    const result = await msalClient.acquireTokenByClientCredential({
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
    // Use the full composite ID format without any colons
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root:/${SHAREPOINT_FOLDER}/${filename}`;
    console.log('Uploading to URL:', uploadUrl);

    // Decode base64 data to binary
    const fileData = Buffer.from(base64Data, 'base64');
    console.log('File size:', fileData.length, 'bytes');

    // First, create the file metadata
    const createFileUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root:/${SHAREPOINT_FOLDER}/${filename}`;
    const createResponse = await fetch(createFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "@microsoft.graph.conflictBehavior": "replace"
      })
    });

    if (!createResponse.ok) {
      console.error('Failed to create file:', await createResponse.text());
      return false;
    }

    // Then upload the content
    const contentUrl = `${createFileUrl}:/content`;
    const uploadResponse = await fetch(contentUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': fileData.length.toString()
      },
      body: fileData
    });

    if (uploadResponse.ok) {
      console.log('✅ Upload successful');
      return true;
    } else {
      console.error('❌ Upload failed:', uploadResponse.status);
      const errorText = await uploadResponse.text();
      console.error('Error details:', errorText);
      
      // Log the request details for debugging
      console.error('Request details:', {
        url: contentUrl,
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Length': fileData.length.toString()
        },
        bodySize: fileData.length
      });
      
      return false;
    }
  } catch (error) {
    console.error('Error uploading to SharePoint:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return false;
  }
} 