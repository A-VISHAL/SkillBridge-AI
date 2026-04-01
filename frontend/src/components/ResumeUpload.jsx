import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadResume, getSampleResume } from '../utils/api'

export default function ResumeUpload({ onResumeUploaded }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const file = acceptedFiles[0]
      const result = await uploadResume(file)
      onResumeUploaded(result.resume_id, result.resume)
    } catch (err) {
      setError(err.message || 'Failed to upload resume')
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  const handleUseSample = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getSampleResume()
      onResumeUploaded(result.resume_id, result.resume)
    } catch (err) {
      setError(err.message || 'Failed to load sample resume')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="card-header">📄 Upload Your Resume</h2>
      
      <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        {isDragActive ? (
          <p>Drop your resume here...</p>
        ) : (
          <>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              Drag & drop your resume here
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              or click to browse (PDF, DOCX, TXT)
            </p>
          </>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--c2)', marginTop: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={handleUseSample} disabled={loading}>
          Use Sample Resume
        </button>
      </div>
    </div>
  )
}
