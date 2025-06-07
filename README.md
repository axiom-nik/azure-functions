# JobDiva SharePoint Sync

This application automates the synchronization of data between JobDiva and SharePoint. It periodically fetches updated records from JobDiva's API and uploads them to a specified SharePoint location.

## Features

- Automatic data fetching from JobDiva every 30 minutes
- Data transformation and mapping according to specified configuration
- Automated upload to SharePoint using Microsoft Graph API
- Visual interface showing sync status and last update time
- Comprehensive error handling and logging

## Prerequisites

- Node.js 18 or higher
- Python 3.8 or higher
- JobDiva API credentials
- Microsoft Graph API credentials
- SharePoint site access

## Setup

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd jobdiva-sharepoint-sync
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   JOBDIVA_API_KEY=your_jobdiva_api_key
   JOBDIVA_API_BASE_URL=your_jobdiva_base_url
   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   MICROSOFT_TENANT_ID=your_microsoft_tenant_id
   SHAREPOINT_SITE_ID=your_sharepoint_site_id
   SHAREPOINT_DRIVE_ID=your_sharepoint_drive_id
   ```

## Running the Application

1. Start the Next.js server:
   ```bash
   npm run dev
   ```

2. The application will automatically:
   - Fetch data from JobDiva every 30 minutes
   - Process and transform the data
   - Upload to SharePoint
   - Display sync status in the UI

## Configuration

- Field mappings between JobDiva and SharePoint are configured in `mapping_fields.csv`
- Adjust the sync interval in the Next.js configuration if needed
- Customize error handling and logging in the Python processing script

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 