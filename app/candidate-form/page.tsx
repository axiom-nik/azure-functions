// src/app/page.tsx
'use client'; // This directive is important for client-side functionality in Next.js App Router

import { useState } from 'react';
import formStyles from '../styles/Form.module.css'; // This is the correct path

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setEditedFileName: React.Dispatch<React.SetStateAction<string>>, documentType: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileExtension = file.name.split('.').pop();
      const newFileName = `${candidateName.replace(/\s+/g, '_')}_${documentType}.${fileExtension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });
      setFile(renamedFile);
      setEditedFileName(newFileName);
    } else {
      setFile(null);
      setEditedFileName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // This is where you would handle form submission, including file uploads.
    // You'll need to send data to your backend API.

    console.log('Form Submitted!');
    console.log('Candidate Name:', candidateName);
    console.log('Resume File:', resumeFile ? resumeFile.name : 'No file');
    console.log('UAN Card File:', uanCardFile ? uanCardFile.name : 'No file');
    console.log('EPFO Service History File:', epfoServiceHistoryFile ? epfoServiceHistoryFile.name : 'No file');
    console.log('EPFO Member Passbook File:', epfoMemberPassbookFile ? epfoMemberPassbookFile.name : 'No file');

    // Example of how you might send data (conceptual, needs backend endpoint)
    /*
    const formData = new FormData();
    formData.append('candidateName', candidateName);
    if (resumeFile) formData.append('resume', resumeFile);
    if (uanCardFile) formData.append('uanCard', uanCardFile);
    // ... append other files

    try {
      const response = await fetch('/api/submit-documents', { // Replace with your actual API endpoint
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Documents submitted successfully!');
        // Reset form or redirect
      } else {
        alert('Submission failed!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred during submission.');
    }
    */
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
        {editedFileName && (
          <input
            type="text"
            value={editedFileName}
            readOnly
            className={formStyles.input}
            style={{ marginTop: '0.5rem' }}
          />
        )}
      </div>
      <button type="submit" className={formStyles.submitButton} style={{ marginLeft: '1rem' }}>
        Submit
      </button>
    </div>
  );

  return (
    <div className={formStyles.container}>
      <div className={formStyles.formCard}>
        <div className={formStyles.headerDots}>
          <div className={formStyles.dot}></div>
          <div className={formStyles.dot}></div>
          <div className={formStyles.dot}></div>
        </div>
        <h1 className={formStyles.title}>Documents Submission</h1>
        <p className={formStyles.greeting}>
          Hi. Michael. When you submit this form, the owner will see your name and email address.
        </p>
        <p className={formStyles.required}>* Required</p>

        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label htmlFor="candidateName" className={formStyles.label}>
              Candidate Name <span className={formStyles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              id="candidateName"
              className={formStyles.input}
              placeholder="Enter your answer"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
            />
          </div>

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
        </form>
      </div>
    </div>
  );
}