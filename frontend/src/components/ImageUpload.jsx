// frontend/src/components/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

const ImageUpload = ({ onImagesChange, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const uploadedUrls = [];
    const totalFiles = files.length;
    let uploaded = 0;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://127.0.0.1:8000/api/upload-image/',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                ((uploaded + progressEvent.loaded / progressEvent.total) / totalFiles) * 100
              );
              setUploadProgress(percentCompleted);
            }
          }
        );

        if (response.data.success) {
          // Make sure the URL is complete
          let imageUrl = response.data.data.url;
          
          // If URL doesn't start with http, add the base URL
          if (!imageUrl.startsWith('http')) {
            imageUrl = `http://127.0.0.1:8000${imageUrl}`;
          }
          
          console.log('📸 Image URL:', imageUrl);
          uploadedUrls.push(imageUrl);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.response?.data?.error || 'Unknown error'}`);
      }

      uploaded++;
      setUploadProgress(Math.round((uploaded / totalFiles) * 100));
    }

    const newImages = [...images, ...uploadedUrls];
    setImages(newImages);
    onImagesChange(newImages);
    setUploading(false);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);

    try {
      const token = localStorage.getItem('token');
      const filename = imageToRemove.split('/').pop();
      await axios.delete(
        'http://127.0.0.1:8000/api/delete-image/',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { filename: `ads/${filename}` }
        }
      );
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        Upload Images
      </label>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        {images.map((url, index) => (
          <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
            <img
              src={url}
              alt={`Upload ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
              onError={(e) => {
                console.error('Image failed to load:', url);
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="12" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        ))}
        
        <div
          style={{
            width: '100px',
            height: '100px',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexDirection: 'column',
            backgroundColor: '#f9fafb'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <div style={{ fontSize: '24px' }}>⏳</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {uploadProgress}%
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '32px' }}>📷</div>
              <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                Add Image
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      <small style={{ color: '#6b7280' }}>
        Max 5MB per image. Allowed: JPG, PNG, GIF, WebP
      </small>
    </div>
  );
};

export default ImageUpload;