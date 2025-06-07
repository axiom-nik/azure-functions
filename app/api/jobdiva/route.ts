import { NextResponse } from 'next/server';
import { JobDivaService } from '@/lib/jobdiva';
import { spawn } from 'child_process';
import path from 'path';
import { writeFileSync, unlinkSync } from 'fs';

interface ExcelResult {
  success: boolean;
  filename?: string;
  path?: string;
  record_count?: number;
  total_records?: number;
  filtered_records?: number;
  error?: string;
}

// Function to run Python script
async function generateExcel(data: any): Promise<ExcelResult> {
  return new Promise<ExcelResult>((resolve, reject) => {
    // Create a temporary JSON file with the data
    const tempFile = 'temp_data.json';
    const scriptPath = path.resolve(process.cwd(), 'lib', 'excel_generator.py');
    const pythonPath = 'C:\\Users\\nikhi\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
    
    try {
      console.log('Writing data to temp file:', tempFile);
      writeFileSync(tempFile, JSON.stringify(data));
      console.log('Data written successfully');
      
      // Spawn Python process with full path
      console.log('Spawning Python process:', pythonPath, scriptPath);
      const pythonProcess = spawn(pythonPath, [scriptPath, tempFile]);
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log('Python stdout:', chunk);
        result += chunk;
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        console.error('Python stderr:', chunk);
        error += chunk;
      });
      
      pythonProcess.on('close', (code) => {
        try {
          // Clean up temp file
          console.log('Python process exited with code:', code);
          unlinkSync(tempFile);
          console.log('Temp file cleaned up');
          
          if (code === 0 && result) {
            try {
              // Try to parse each line as JSON
              const lines = result.trim().split('\n');
              const lastLine = lines[lines.length - 1];
              const pythonResult = JSON.parse(lastLine);
              
              if (pythonResult.success) {
                console.log('Excel generation successful:', pythonResult);
                resolve(pythonResult);
              } else {
                console.error('Excel generation failed:', pythonResult.error);
                resolve({
                  success: false,
                  error: pythonResult.error || 'Unknown error in Python script'
                });
              }
            } catch (err) {
              console.error('Error parsing Python output:', err);
              resolve({
                success: false,
                error: `Error parsing Python output: ${err}`
              });
            }
          } else {
            console.error('Python process failed:', error || `Exit code: ${code}`);
            resolve({
              success: false,
              error: error || `Python process exited with code ${code}`
            });
          }
        } catch (err) {
          console.error('Error in process close handler:', err);
          resolve({
            success: false,
            error: `Error processing Python result: ${err}`
          });
        }
      });
    } catch (err) {
      console.error('Error running Python script:', err);
      resolve({
        success: false,
        error: `Error running Python script: ${err}`
      });
    }
  });
}

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
    
    if (!excelResult.success) {
      console.error('Excel generation error:', excelResult.error);
      return NextResponse.json({ error: excelResult.error }, { status: 500 });
    }
    
    console.log('Request completed successfully');
    return NextResponse.json({
      success: true,
      data: response.data,
      excel: {
        filename: excelResult.filename,
        path: excelResult.path,
        total_records: excelResult.total_records,
        filtered_records: excelResult.filtered_records
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
    
    if (!excelResult.success) {
      console.error('Excel generation error:', excelResult.error);
      return NextResponse.json({ error: excelResult.error }, { status: 500 });
    }
    
    console.log('Request completed successfully');
    return NextResponse.json({
      success: true,
      data: response.data,
      excel: {
        filename: excelResult.filename,
        path: excelResult.path,
        total_records: excelResult.total_records,
        filtered_records: excelResult.filtered_records
      }
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
} 