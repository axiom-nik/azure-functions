import { NextResponse } from 'next/server';
import { JobDivaService } from '@/lib/jobdiva';
import { generateExcel } from '@/lib/excelGenerator';

export async function GET() {
  try {
    console.log('Starting GET request');
    const service = new JobDivaService();
    
    console.log('Fetching data from JobDiva');
    const response = await service.fetchInitialData();
    
    if (!response.success || !response.data) {
      console.error('JobDiva API error:', response.error);
      throw new Error(response.error || 'Failed to fetch data from JobDiva');
    }
    
    console.log('Generating Excel file');
    const excelResult = await generateExcel(response.data);
    
    if (!excelResult.success || !excelResult.buffer) {
      console.error('Excel generation error:', excelResult.error);
      return NextResponse.json({ error: excelResult.error }, { status: 500 });
    }
    
    console.log('Request completed successfully');
    return NextResponse.json({
      success: true,
      data: response.data,
      excel: {
        filename: excelResult.filename,
        total_records: excelResult.total_records,
        filtered_records: excelResult.filtered_records,
        buffer: excelResult.buffer.toString('base64')
      }
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Starting POST request');
    const service = new JobDivaService();
    
    console.log('Fetching data from JobDiva');
    const response = await service.fetchInitialData();
    
    if (!response.success || !response.data) {
      console.error('JobDiva API error:', response.error);
      throw new Error(response.error || 'Failed to fetch data from JobDiva');
    }
    
    console.log('Generating Excel file');
    const excelResult = await generateExcel(response.data);
    
    if (!excelResult.success || !excelResult.buffer) {
      console.error('Excel generation error:', excelResult.error);
      return NextResponse.json({ error: excelResult.error }, { status: 500 });
    }
    
    console.log('Request completed successfully');
    return NextResponse.json({
      success: true,
      data: response.data,
      excel: {
        filename: excelResult.filename,
        total_records: excelResult.total_records,
        filtered_records: excelResult.filtered_records,
        buffer: excelResult.buffer.toString('base64')
      }
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
} 