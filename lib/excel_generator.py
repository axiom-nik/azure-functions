import os
import json
import sys
import pandas as pd
from datetime import datetime

# Define the required fields
REQUIRED_FIELDS = [
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
]

def generate_excel(data):
    """Generate Excel file from JobDiva data"""
    try:
        # Print data structure for debugging
        print(json.dumps({'debug': 'Data structure received:', 'data': data[:1] if isinstance(data, list) else data}, indent=2))
        
        # Convert data to DataFrame
        if isinstance(data, dict) and 'data' in data:
            # If data is wrapped in a response object
            df = pd.DataFrame(data['data'])
        else:
            # If data is directly an array
            df = pd.DataFrame(data)
        
        # Print columns for debugging
        print(json.dumps({'debug': 'Available columns:', 'columns': df.columns.tolist()}))
        
        # Check if the required column exists
        if 'L1 Interview Status' not in df.columns:
            raise ValueError(f"Column 'L1 Interview Status' not found. Available columns: {df.columns.tolist()}")
        
        # Filter for Selected for L2 status
        filtered_df = df[df['L1 Interview Status'] == 'Selected for L2']
        
        # Select only the required fields that exist in the DataFrame
        existing_fields = [field for field in REQUIRED_FIELDS if field in filtered_df.columns]
        filtered_df = filtered_df[existing_fields]
        
        # Create Excel_Tables directory if it doesn't exist
        os.makedirs('Excel_Tables', exist_ok=True)
        
        # Use fixed filename
        filename = "DemoDatabase2.xlsx"
        output_path = os.path.join('Excel_Tables', filename)
        
        # Save to Excel
        filtered_df.to_excel(output_path, index=False)
        
        result = {
            'success': True,
            'filename': filename,
            'path': output_path,
            'record_count': len(filtered_df),
            'total_records': len(df),
            'filtered_records': len(filtered_df),
            'fields_included': existing_fields,
            'missing_fields': [field for field in REQUIRED_FIELDS if field not in existing_fields]
        }
        print(json.dumps({'debug': 'Operation completed successfully', 'result': result}, indent=2))
        return result
    except Exception as e:
        error_msg = f"Error generating Excel: {str(e)}"
        print(json.dumps({'error': error_msg}, indent=2))
        return {
            'success': False,
            'error': error_msg
        }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'Input file path is required'}))
        sys.exit(1)
        
    input_file = sys.argv[1]
    
    try:
        print(json.dumps({'debug': f'Reading input file: {input_file}'}, indent=2))
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        result = generate_excel(data)
        print(json.dumps(result))
        sys.exit(0 if result['success'] else 1)
    except Exception as e:
        error_msg = f"Script error: {str(e)}"
        print(json.dumps({'success': False, 'error': error_msg}, indent=2))
        sys.exit(1) 