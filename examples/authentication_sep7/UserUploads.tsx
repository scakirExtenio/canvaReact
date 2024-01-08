import React, { useState, useEffect } from 'react';
import { auth } from "@canva/user";
import { Button, Grid, Rows, Text, TextInput, Title } from "@canva/app-ui-kit";
import MediaUploadList from './MediaUploadList';

const getOrginalKeyFromFileKey = (key) => {
  const index_slash = key.lastIndexOf('/');
  const index_dot = key.lastIndexOf('.');
  const extension = key.substring(index_dot, key.length);

  const orginalKeyFromFileKey = key.substring(0, index_slash + 1) + 'original' + extension;
  return orginalKeyFromFileKey
}

const getAudioDuration = (url: string): Promise<number>  => {
  return new Promise((resolve, reject) => {
    let audio = new Audio();
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      const durationInMilliseconds = parseFloat((audio.duration * 1000).toFixed(0)); // Convert to milliseconds
      resolve(durationInMilliseconds); 
      audio.srcObject = null;
      audio = null;
    });
    audio.addEventListener('error', () => {
      reject('Error loading audio');
    });
  });
}

const UserUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // State to store the search term
  const [activeTab, setActiveTab] = useState('all'); // New state for active tab

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await auth.getCanvaUserToken();
        const response = await fetch(`${BACKEND_HOST}/api/user/uploads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token, // Include the Canva user token in the request body
          }),
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        const uploadsWithDuration = await Promise.all(data.uploads.map(async (upload) => {
          if (upload.type.startsWith('audio/')) {
            try {
              const durationMs = await getAudioDuration(`${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(upload.key)}`);
              return { ...upload, durationMs };
            } catch (error) {
              console.error('Error getting audio duration:', error);
              return { ...upload, durationMs: null }; // or some default value
            }
          } else {
            return upload;
          }
        }));

        setUploads(uploadsWithDuration);
      } catch (error) {
        console.error('Error fetching user uploads:', error.message);
      }
    };

    fetchData();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filterUploadsByType = (type) => {
    switch (type) {
      case 'image':
        return uploads.filter(upload => upload.type.startsWith('image/'));
      case 'video':
        return uploads.filter(upload => upload.type.startsWith('video/'));
      case 'audio':
        return uploads.filter(upload => upload.type.startsWith('audio/'));
      default:
        return uploads;
    }
  };

  const sortUploadsByType = (uploads) => {
    return uploads.slice().sort((a, b) => a.type.localeCompare(b.type));
  };

  const getUploads = () => {
    return activeTab === 'all' ? sortUploadsByType(uploads) : filterUploadsByType(activeTab);
  };

  const filteredUploads = getUploads().filter(upload => 
    upload.title.toLowerCase().includes(searchTerm)
  );

  const getButtonVariant = (tabName) => {
    return activeTab === tabName ? "primary" : "secondary";
  };


  return (
    <div>
      <Title size='large'>User Uploads</Title>
      <Rows spacing="2u">        
          <TextInput 
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
          />
          
          <Grid columns={4} spacing="1.5u">
            <Button onClick={() => setActiveTab('all')}   variant={getButtonVariant('all')}>All</Button>
            <Button onClick={() => setActiveTab('image')} variant={getButtonVariant('image')}>Images</Button>
            <Button onClick={() => setActiveTab('video')} variant={getButtonVariant('video')}>Videos</Button>
            <Button onClick={() => setActiveTab('audio')} variant={getButtonVariant('audio')}>Audios</Button>
          </Grid>

          <MediaUploadList uploads={filteredUploads} />
      </Rows>
    </div>
  );
};

export default UserUploads;

