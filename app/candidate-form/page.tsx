// src/app/page.tsx
'use client'; // This directive is important for client-side functionality in Next.js App Router

import { useState, useEffect } from 'react';
import formStyles from '../styles/Form.module.css'; // This is the correct path
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DocumentsSubmissionPage() {
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateNameForDisplay, setCandidateNameForDisplay] = useState<string>('');
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [uanCardFiles, setUanCardFiles] = useState<File[]>([]);
  const [epfoServiceHistoryFiles, setEpfoServiceHistoryFiles] = useState<File[]>([]);
  const [epfoMemberPassbookFiles, setEpfoMemberPassbookFiles] = useState<File[]>([]);
  const [editedResumeFileName, setEditedResumeFileName] = useState<string>('');
  const [editedUanCardFileName, setEditedUanCardFileName] = useState<string>('');
  const [editedEpfoServiceHistoryFileName, setEditedEpfoServiceHistoryFileName] = useState<string>('');
  const [editedEpfoMemberPassbookFileName, setEditedEpfoMemberPassbookFileName] = useState<string>('');
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<boolean>(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
      setCandidateName(dataParam); // Store the full data parameter for renaming
      const name = dataParam.replace(/_\d+$/, '').replace(/_/g, ' '); // Remove the last part and replace underscores with spaces for display
      setCandidateNameForDisplay(name);
    }
  }, []);

  useEffect(() => {
    document.title = 'Axiom Background Check';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFiles: React.Dispatch<React.SetStateAction<File[]>>, setEditedFileName: React.Dispatch<React.SetStateAction<string>>, documentType: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...files]);
      setEditedFileName(prevNames => [...prevNames.split(', '), ...files.map(file => file.name)].join(', '));
    }
  };

  const generateTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  const renameFile = (file: File | null, documentType: string, index: number): File | null => {
    if (!file) return null;
    const fileExtension = file.name.split('.').pop();
    const timestamp = generateTimestamp();
    const uniqueId = `${timestamp}_${index}`; // Add index to ensure uniqueness
    const newFileName = `${candidateName}_${documentType}_${uniqueId}.${fileExtension}`;
    return new File([file], newFileName, { type: file.type });
  };

  const uploadFileToSharePoint = async (file: File | null, documentType: string) => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) return;

        const toastId = toast.loading(`Uploading ${documentType}...`);

        const response = await fetch('/api/sharepoint/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64Data,
            filename: file.name,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${documentType} to SharePoint`);
        }

        toast.update(toastId, { render: `${documentType} uploaded successfully!`, type: 'success', isLoading: false, autoClose: 5000 });
      };
      reader.onerror = () => {
        toast.error(`Error reading ${documentType}`);
        setUploadError(true); // Set error state
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = (error as Error).message;
      toast.error(`An error occurred during ${documentType} upload: ${errorMessage}`);
      setUploadError(true); // Set error state
    }
  };

  // Single submit handler for all file uploads
  const handleSubmitAll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(false); // Reset error state

    const renamedResumeFiles = resumeFiles.map((file, index) => renameFile(file, 'resume', index));
    const renamedUanCardFiles = uanCardFiles.map((file, index) => renameFile(file, 'uanCard', index));
    const renamedEpfoServiceHistoryFiles = epfoServiceHistoryFiles.map((file, index) => renameFile(file, 'epfoServiceHistory', index));
    const renamedEpfoMemberPassbookFiles = epfoMemberPassbookFiles.map((file, index) => renameFile(file, 'epfoMemberPassbook', index));

    for (const file of renamedResumeFiles) {
      await uploadFileToSharePoint(file, 'Resume');
    }
    for (const file of renamedUanCardFiles) {
      await uploadFileToSharePoint(file, 'UAN Card');
    }
    for (const file of renamedEpfoServiceHistoryFiles) {
      await uploadFileToSharePoint(file, 'EPFO Service History');
    }
    for (const file of renamedEpfoMemberPassbookFiles) {
      await uploadFileToSharePoint(file, 'EPFO Member Passbook');
    }

    if (!uploadError) {
      setTimeout(() => setUploadComplete(true), 10000);
    }
  };

  const handleConsentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsentGiven(event.target.checked);
  };

  interface FileUploadInputProps {
    label: string;
    id: string;
    file: File[];
    setFile: React.Dispatch<React.SetStateAction<File[]>>;
    limit: number;
    allowedTypes: string[];
    tooltipText?: string;
    editedFileName: string;
    setEditedFileName: React.Dispatch<React.SetStateAction<string>>;
  }

  const FileUploadInput: React.FC<FileUploadInputProps> = ({ label, id, file, setFile, limit, allowedTypes, tooltipText, editedFileName, setEditedFileName }) => (
    <div className={formStyles.formGroup} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <label htmlFor={id} className={formStyles.label}>
          {label}
          <span className={formStyles.requiredStar}>*</span>
          {tooltipText && (
            <div className={formStyles.tooltipContainer}>
              <span className={formStyles.tooltipIcon}>ⓘ</span>
              <span className={formStyles.tooltipText}>{tooltipText}</span>
            </div>
          )}
        </label>
        <input
          type="file"
          id={id}
          onChange={(e) => handleFileChange(e, setFile, setEditedFileName, id)}
          style={{ display: 'none' }}
          accept={allowedTypes.join(', ')}
          multiple={limit > 1}
        />
        <div
          className={formStyles.uploadBox}
          onClick={() => document.getElementById(id)!.click()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setFile(prevFiles => [...prevFiles, ...files]);
            setEditedFileName(prevNames => [...prevNames.split(', '), ...files.map(file => file.name)].join(', '));
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className={formStyles.uploadIcon}>⬆</div>
          <div className={formStyles.uploadText}>Upload file</div>
          {file && file.length > 0 && <div className={formStyles.fileInfo}>Selected: {file.map((f: File) => f.name).join(', ')}</div>}
          <div className={formStyles.fileInfo}>
            File number limit: {limit} Single file size limit: 10MB
          </div>
        </div>
        {file && file.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={file.map((f: File) => f.name).join(', ')}
              readOnly
              className={formStyles.input}
              style={{ marginRight: '0.5rem', width: '100%' }}
            />
            <button
              type="button"
              onClick={() => {
                setFile([]);
                setEditedFileName('');
              }}
              className={formStyles.deleteButton}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const isSubmitEnabled = resumeFiles.length > 0 && uanCardFiles.length > 0 && epfoServiceHistoryFiles.length > 0 && epfoMemberPassbookFiles.length > 0 && consentGiven;

  return (
    <div className={formStyles.container}>
      <ToastContainer />
      {uploadComplete ? (
        <div className={formStyles.formCard}>
          <div className={formStyles.headerDots}>
            <div className={formStyles.dot}></div>
            <div className={formStyles.dot}></div>
            <div className={formStyles.dot}></div>
          </div>
          <h1 className={formStyles.title}>Thank you, {candidateNameForDisplay}!</h1>
          <p className={formStyles.greeting}>The uploaded documents have been successfully received. Our BGV team will promptly review the submission and will be in touch in case any additional information is needed.</p>
          <p className={formStyles.greeting}>We appreciate the opportunity to represent you in your career pursuit and look forward to working with you.</p>
          <p className={formStyles.greeting}>Have a wonderful day!</p>
          <p className={formStyles.greeting}>You may close this browser window at this time.</p>
          <button className={formStyles.closeButton} onClick={() => window.close()}>Close Window</button>
        </div>
      ) : (
        <div className={formStyles.formCard}>
          <div className={formStyles.headerDots}>
            <div className={formStyles.dot}></div>
            <div className={formStyles.dot}></div>
            <div className={formStyles.dot}></div>
          </div>
          <h1 className={formStyles.title}>Welcome, {candidateNameForDisplay}!</h1>
          <p className={formStyles.greeting}>Thank you for responding to the BGV document request!</p>
          <p className={formStyles.instructions}>A couple of suggestions to avoid delays:</p>
          <ul className={formStyles.instructionsList}>
            <li>Please ensure documents are clear, complete, and not password-protected</li>
            <li>All uploads must be in PDF, DOC/DOCX, or image (JPG/PNG) formats</li>
          </ul>
          <p className={formStyles.instructions}>All files shared here are transmitted over a secure, encrypted channel and stored safely in compliance with our data protection policies.</p>
          <p className={formStyles.instructions}>If you face any technical issues, please reach out to our UAN team led by Brian Wells at <a href="mailto:Brian.Wells@axiomglobal.com">Brian.Wells@axiomglobal.com</a>.</p>
          <p className={formStyles.instructions}>We're excited to have you moving up in the hiring process.</p>

          {uploadError && (
            <p className={formStyles.errorMessage} style={{ color: 'red', marginTop: '1rem' }}>
              An error occurred during the upload. Please try again.
            </p>
          )}

          <form onSubmit={handleSubmitAll} className={formStyles.form}>
            <div className={formStyles.logoContainer} style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src="/axiom_logo_01.png" alt="Axiom Global Technologies Logo" className={formStyles.logo} style={{ width: '300px' }} />
            </div>
            <h1 className={formStyles.title}>Document Submission</h1>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Candidate Name:</label>
              <span className={formStyles.candidateName}>{candidateNameForDisplay}</span>
            </div>

            <FileUploadInput
              label="Resume"
              id="resume"
              file={resumeFiles}
              setFile={setResumeFiles}
              limit={1}
              allowedTypes={[".pdf", ".doc", ".docx"]}
              editedFileName={editedResumeFileName}
              setEditedFileName={setEditedResumeFileName}
            />

            <FileUploadInput
              label="UAN Card"
              id="uanCard"
              file={uanCardFiles}
              setFile={setUanCardFiles}
              limit={1}
              allowedTypes={[".pdf"]}
              editedFileName={editedUanCardFileName}
              setEditedFileName={setEditedUanCardFileName}
            />

            <FileUploadInput
              label="EPFO Service History"
              id="epfoServiceHistory"
              file={epfoServiceHistoryFiles}
              setFile={setEpfoServiceHistoryFiles}
              limit={20}
              allowedTypes={[".pdf"]}
              editedFileName={editedEpfoServiceHistoryFileName}
              setEditedFileName={setEditedEpfoServiceHistoryFileName}
            />

            <FileUploadInput
              label="EPFO Member Passbook"
              id="epfoMemberPassbook"
              file={epfoMemberPassbookFiles}
              setFile={setEpfoMemberPassbookFiles}
              limit={20}
              allowedTypes={[".pdf"]}
              editedFileName={editedEpfoMemberPassbookFileName}
              setEditedFileName={setEditedEpfoMemberPassbookFileName}
            />

            <div className={formStyles.consentContainer}>
              <input
                type="checkbox"
                id="consentCheckbox"
                checked={consentGiven}
                onChange={handleConsentChange}
              />
              <label htmlFor="consentCheckbox">
                I consent to Axiom Global collecting and using my documents for recruitment, background checks, and onboarding. I understand my information may be shared with clients or verification partners as needed for these purposes.
              </label>
            </div>

            <button type="submit" className={formStyles.submitButton} disabled={!isSubmitEnabled}>
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}