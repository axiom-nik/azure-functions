import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface ExcelResult {
  success: boolean;
  filename?: string;
  buffer?: Buffer;
  record_count?: number;
  total_records?: number;
  filtered_records?: number;
  fields_included?: string[];
  missing_fields?: string[];
  error?: string;
}

// Define the required fields
const REQUIRED_FIELDS = [
  'ACTIVITYID',
  'DATECREATED',
  'DATEUPDATED',
  'DATEUSERFIELDUPDATED',
  'INTERVIEWSCHEDULEDATE',
  'CANDIDATEID',
  'CANDIDATEFIRSTNAME',
  'CANDIDATELASTNAME',
  'CANDIDATEEMAIL',
  'JOBREFERENCENUMBER',
  'JOBTITLE',
  'DIVISION',
  'COMPANYNAME',
  'SUBMITTALDATE',
  'INTERVIEWDATE',
  'INTERVIEW_TIMEZONEID',
  'L1 Interview Status'
];

export async function generateExcel(data: any): Promise<ExcelResult> {
  try {
    console.log('Starting Excel generation');
    
    // Convert data to array if it's wrapped in a response object
    const records = Array.isArray(data) ? data : (data.data || []);
    
    // Calculate the date 5 days prior to the toDate
    const toDate = new Date(); // Assuming toDate is today
    const fiveDaysPrior = new Date(toDate);
    fiveDaysPrior.setDate(toDate.getDate() - 5);

    // Filter for Selected for L2 status, Capgemini India, and INTERVIEWDATE condition
    const filteredRecords = records.filter((record: any) => {
      const interviewDate = new Date(record['INTERVIEWDATE']);
      return (
        record['L1 Interview Status'] === 'Selected for L2' &&
        record['COMPANYNAME'] === 'Capgemini India' &&
        interviewDate >= fiveDaysPrior
      );
    });

    // Select only the required fields that exist in the records
    const existingFields = REQUIRED_FIELDS.filter(field => 
      filteredRecords.length > 0 && field in filteredRecords[0]
    );

    // Create worksheet with filtered data
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRecords.map((record: any) => {
        const filteredRecord: any = {};
        existingFields.forEach(field => {
          filteredRecord[field] = record[field];
        });
        return filteredRecord;
      })
    );

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'L2 Selected Candidates');

    // Generate Excel file in memory
    const filename = 'l2Selected.xlsx';
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('Excel file generated successfully in memory');
    
    // Create JSON data with filtered records in memory
    const jsonBuffer = Buffer.from(JSON.stringify(filteredRecords, null, 2));
    console.log('JSON data created in memory');
    
    return {
      success: true,
      filename,
      buffer: excelBuffer,
      record_count: filteredRecords.length,
      total_records: records.length,
      filtered_records: filteredRecords.length,
      fields_included: existingFields,
      missing_fields: REQUIRED_FIELDS.filter(field => !existingFields.includes(field))
    };
  } catch (error) {
    console.error('Error generating Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 