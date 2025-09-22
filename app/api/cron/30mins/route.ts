import { NextResponse } from 'next/server';
import { JobDivaService, type JobDivaRegion } from '@/lib/jobdiva';
import { generateExcel } from '@/lib/excelGenerator';
import { get_access_token, upload_file_to_sharepoint } from '@/lib/sharepoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cronRegion = (process.env.JOBDIVA_CRON_REGION as JobDivaRegion | undefined) ?? 'INDIA';
    const service = new JobDivaService(cronRegion);

    const jobdivaResult = await service.fetchInitialData();
    if (!jobdivaResult.success || !jobdivaResult.data) {
      const error = jobdivaResult.error ?? 'Failed to fetch JobDiva data';
      return NextResponse.json({ success: false, step: 'jobdiva', error }, { status: 500 });
    }

    const excelResult = await generateExcel(jobdivaResult.data);
    if (!excelResult.success || !excelResult.buffer || !excelResult.filename) {
      const error = excelResult.error ?? 'Failed to generate Excel payload';
      return NextResponse.json({ success: false, step: 'excel', error }, { status: 500 });
    }

    const accessToken = await get_access_token();
    if (!accessToken) {
      return NextResponse.json({ success: false, step: 'auth', error: 'Missing SharePoint access token' }, { status: 500 });
    }

    const uploadSucceeded = await upload_file_to_sharepoint(
      accessToken,
      excelResult.buffer.toString('base64'),
      excelResult.filename,
    );

    if (!uploadSucceeded) {
      return NextResponse.json({ success: false, step: 'upload', error: 'SharePoint upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      filename: excelResult.filename,
      counts: {
        total: excelResult.total_records ?? null,
        filtered: excelResult.filtered_records ?? null,
      },
      metadata: {
        region: cronRegion,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, step: 'unexpected', error: message }, { status: 500 });
  }
}
