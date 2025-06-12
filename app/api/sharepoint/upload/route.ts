import { NextResponse } from 'next/server';
import { get_access_token, upload_file_to_sharepoint } from '@/lib/sharepoint';

export async function POST(request: Request) {
  try {
    const { base64Data, filename } = await request.json();

    if (!base64Data || !filename) {
      console.error('Missing required parameters:', { hasBase64Data: !!base64Data, hasFilename: !!filename });
      return NextResponse.json(
        { error: 'Missing required parameters: base64Data and filename' },
        { status: 400 }
      );
    }

    console.log('Starting SharePoint upload process for file:', filename);

    // Get access token
    console.log('Getting access token...');
    const accessToken = await get_access_token();
    if (!accessToken) {
      console.error('Failed to get access token');
      return NextResponse.json(
        { error: 'Failed to get SharePoint access token' },
        { status: 500 }
      );
    }
    console.log('Successfully obtained access token');

    // Upload file to SharePoint
    console.log('Uploading file to SharePoint...');
    const uploadResult = await upload_file_to_sharepoint(accessToken, base64Data, filename);
    
    if (!uploadResult) {
      console.error('Upload failed');
      return NextResponse.json(
        { error: 'Failed to upload file to SharePoint' },
        { status: 500 }
      );
    }

    console.log('Upload completed successfully');
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to SharePoint'
    });
  } catch (error) {
    console.error('Error in SharePoint upload:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 