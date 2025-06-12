import { NextResponse } from 'next/server';
import { get_access_token, upload_file_to_sharepoint } from '@/lib/sharepoint';

export async function POST(request: Request) {
  try {
    const { base64Data, filename } = await request.json();

    if (!base64Data || !filename) {
      return NextResponse.json(
        { error: 'Missing required parameters: base64Data and filename' },
        { status: 400 }
      );
    }

    // Get access token
    const accessToken = await get_access_token();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get SharePoint access token' },
        { status: 500 }
      );
    }

    // Upload file to SharePoint
    const uploadResult = await upload_file_to_sharepoint(accessToken, base64Data, filename);
    
    if (!uploadResult) {
      return NextResponse.json(
        { error: 'Failed to upload file to SharePoint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to SharePoint'
    });
  } catch (error) {
    console.error('Error in SharePoint upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 