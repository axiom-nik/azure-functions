import os
import requests
import msal
from dotenv import load_dotenv

# === LOAD ENV VARIABLES ===
load_dotenv(dotenv_path=".env.local")

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
SITE_ID = os.getenv("SITE_ID")
DRIVE_ID = os.getenv("DRIVE_ID")
SHAREPOINT_FOLDER = os.getenv("SHAREPOINT_FOLDER")
EXCEL_FILE_PATH = os.getenv("EXCEL_FILE_PATH")
EXCEL_FILE_NAME = os.path.basename(EXCEL_FILE_PATH)

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
def upload_file_to_sharepoint(access_token):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/octet-stream"
    }

    upload_url = (
        f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drives/{DRIVE_ID}/"
        f"root:/{SHAREPOINT_FOLDER}/{EXCEL_FILE_NAME}:/content"
    )

    with open(EXCEL_FILE_PATH, "rb") as f:
        response = requests.put(upload_url, headers=headers, data=f)

    if response.status_code in (200, 201):
        print(f"✅ Upload successful: {response.json().get('webUrl')}")
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)

# === MAIN EXECUTION ===
if __name__ == "__main__":
    token = get_access_token()
    upload_file_to_sharepoint(token)
