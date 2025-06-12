import os
import requests
import msal
import base64
from dotenv import load_dotenv

# === LOAD ENV VARIABLES ===
load_dotenv(dotenv_path=".env.local")

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
SITE_ID = os.getenv("SITE_ID")
DRIVE_ID = os.getenv("DRIVE_ID")
SHAREPOINT_FOLDER = os.getenv("SHAREPOINT_FOLDER")

# === STEP 1: Authenticate via MSAL ===
def get_access_token():
    authority = f"https://login.microsoftonline.com/{TENANT_ID}"
    app = msal.ConfidentialClientApplication(
        CLIENT_ID, authority=authority, client_credential=CLIENT_SECRET
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if "access_token" in result:
        return result["access_token"]
    else:
        raise Exception(f"Authentication failed: {result.get('error_description')}")

# === STEP 2: Upload file ===
def upload_file_to_sharepoint(access_token, base64_data, filename):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/octet-stream"
    }

    upload_url = (
        f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drives/{DRIVE_ID}/"
        f"root:/{SHAREPOINT_FOLDER}/{filename}:/content"
    )

    # Decode base64 data to binary
    file_data = base64.b64decode(base64_data)
    
    response = requests.put(upload_url, headers=headers, data=file_data)

    if response.status_code in (200, 201):
        print(f"✅ Upload successful: {response.json().get('webUrl')}")
        return True
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)
        return False

# === MAIN EXECUTION ===
if __name__ == "__main__":
    # This is just for testing - in production, this will be called with data from the API
    token = get_access_token()
    # Example usage:
    # upload_file_to_sharepoint(token, base64_data, "DemoDatabase2.xlsx")
