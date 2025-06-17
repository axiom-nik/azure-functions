// src/app/page.tsx
'use client'; // This directive is important for client-side functionality in Next.js App Router

import { useState, useEffect } from 'react';
import formStyles from '../styles/Form.module.css'; // This is the correct path
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DocumentsSubmissionPage() {
  const [candidateName, setCandidateName] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uanCardFile, setUanCardFile] = useState<File | null>(null);
  const [epfoServiceHistoryFile, setEpfoServiceHistoryFile] = useState<File | null>(null);
  const [epfoMemberPassbookFile, setEpfoMemberPassbookFile] = useState<File | null>(null);
  const [editedResumeFileName, setEditedResumeFileName] = useState<string>('');
  const [editedUanCardFileName, setEditedUanCardFileName] = useState<string>('');
  const [editedEpfoServiceHistoryFileName, setEditedEpfoServiceHistoryFileName] = useState<string>('');
  const [editedEpfoMemberPassbookFileName, setEditedEpfoMemberPassbookFileName] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
      setCandidateName(dataParam);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setEditedFileName: React.Dispatch<React.SetStateAction<string>>, documentType: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);
      setEditedFileName(file.name);
    } else {
      setFile(null);
      setEditedFileName('');
    }
  };

  const uploadFileToSharePoint = async (file: File | null, filename: string) => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) return;

        const response = await fetch('/api/sharepoint/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64Data,
            filename,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${filename} to SharePoint`);
        }

        toast.success(`${filename} uploaded successfully!`);
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = (error as Error).message;
      toast.error(`An error occurred during file upload: ${errorMessage}`);
    }
  };

  // Single submit handler for all file uploads
  const handleSubmitAll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const renameFile = (file: File | null, documentType: string): File | null => {
      if (!file) return null;
      const fileExtension = file.name.split('.').pop();
      const newFileName = `${candidateName.replace(/\s+/g, '_')}_${documentType}.${fileExtension}`;
      return new File([file], newFileName, { type: file.type });
    };

    const renamedResumeFile = renameFile(resumeFile, 'resume');
    const renamedUanCardFile = renameFile(uanCardFile, 'uanCard');
    const renamedEpfoServiceHistoryFile = renameFile(epfoServiceHistoryFile, 'epfoServiceHistory');
    const renamedEpfoMemberPassbookFile = renameFile(epfoMemberPassbookFile, 'epfoMemberPassbook');

    await uploadFileToSharePoint(renamedResumeFile, renamedResumeFile?.name || '');
    await uploadFileToSharePoint(renamedUanCardFile, renamedUanCardFile?.name || '');
    await uploadFileToSharePoint(renamedEpfoServiceHistoryFile, renamedEpfoServiceHistoryFile?.name || '');
    await uploadFileToSharePoint(renamedEpfoMemberPassbookFile, renamedEpfoMemberPassbookFile?.name || '');
  };

  interface FileUploadInputProps {
    label: string;
    id: string;
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
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
        accept={allowedTypes.map(type => `.${type.toLowerCase()}`).join(',')}
        multiple={limit > 1}
      />
      <div className={formStyles.uploadBox} onClick={() => document.getElementById(id)!.click()}>
        <div className={formStyles.uploadIcon}>⬆</div>
        <div className={formStyles.uploadText}>Upload file</div>
        {file && <div className={formStyles.fileInfo}>Selected: {file.name}</div>}
        <div className={formStyles.fileInfo}>
          File number limit: {limit} Single file size limit: 10MB Allowed file types: {allowedTypes.join(', ')}
        </div>
      </div>
      {file && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
          <input
            type="text"
            value={file.name}
            readOnly
            className={formStyles.input}
            style={{ marginRight: '0.5rem' }}
          />
          <button
            type="button"
            onClick={() => {
              setFile(null);
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

  const isSubmitEnabled = resumeFile && uanCardFile && epfoServiceHistoryFile && epfoMemberPassbookFile;

  return (
    <div className={formStyles.container}>
      <ToastContainer />
      <div className={formStyles.formCard}>
        <div className={formStyles.headerDots}>
          <div className={formStyles.dot}></div>
          <div className={formStyles.dot}></div>
          <div className={formStyles.dot}></div>
        </div>
        <h1 className={formStyles.title}>Documents Submission</h1>
        <p className={formStyles.required}>* Required</p>

        <form onSubmit={handleSubmitAll}>
          <FileUploadInput
            label="Resume"
            id="resume"
            file={resumeFile}
            setFile={setResumeFile}
            limit={1}
            allowedTypes={['Word', 'PDF']}
            tooltipText="This question is not anonymous; the owner will see your name."
            editedFileName={editedResumeFileName}
            setEditedFileName={setEditedResumeFileName}
          />

          <FileUploadInput
            label="UAN Card"
            id="uanCard"
            file={uanCardFile}
            setFile={setUanCardFile}
            limit={1}
            allowedTypes={['PDF']}
            tooltipText="This question is not anonymous; the owner will see your name."
            editedFileName={editedUanCardFileName}
            setEditedFileName={setEditedUanCardFileName}
          />

          <FileUploadInput
            label="EPFO Service History"
            id="epfoServiceHistory"
            file={epfoServiceHistoryFile}
            setFile={setEpfoServiceHistoryFile}
            limit={10}
            allowedTypes={['PDF']}
            tooltipText="This question is not anonymous; the owner will see your name."
            editedFileName={editedEpfoServiceHistoryFileName}
            setEditedFileName={setEditedEpfoServiceHistoryFileName}
          />

          <FileUploadInput
            label="EPFO Member Passbook"
            id="epfoMemberPassbook"
            file={epfoMemberPassbookFile}
            setFile={setEpfoMemberPassbookFile}
            limit={1}
            allowedTypes={['PDF']}
            tooltipText="This question is not anonymous; the owner will see your name."
            editedFileName={editedEpfoMemberPassbookFileName}
            setEditedFileName={setEditedEpfoMemberPassbookFileName}
          />

          <button
            type="submit"
            className={`${formStyles.submitButton} ${!isSubmitEnabled ? formStyles.disabledButton : ''}`}
            style={{ marginTop: '1rem' }}
            disabled={!isSubmitEnabled}
          >
            Submit
          </button>
          <p className={formStyles.comment} style={{ marginTop: '0.5rem' }}>
            {isSubmitEnabled ? 'You may submit all four documents now.' : 'All four documents need to be uploaded together.'}
          </p>
        </form>
      </div>
    </div>
  );
}