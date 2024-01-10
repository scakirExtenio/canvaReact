import React, { useState, useEffect } from 'react';
import { auth } from "@canva/user";
import { Button, Grid, Rows, Text, TextInput, Title } from "@canva/app-ui-kit";
import MediaUploadList from './MediaUploadList';
import translationsEn from './translations/en';
import translationsDe from './translations/de';

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
  const [error, setError] = useState(null); // State to store the error

  // Determine the browser language and set the appropriate translations
  const browserLanguage = navigator.language.startsWith('de') ? 'de' : 'en';
  const translations = browserLanguage === 'de' ? translationsDe : translationsEn;


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
          if (response.status === 401) {
            setError(translations.featureError);
          } else {
            throw new Error('Network response was not ok');
          }
        } else {
          setError(null); // Reset error state if the request is successful
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
    setSearchTerm(e.toLowerCase());
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
      <Title size='large'>{translations.userUploads}</Title>
      <Rows spacing="2u">        
          <TextInput 
              placeholder={translations.search}
              value={searchTerm}
              onChange={handleSearchChange}
          />
          
          <Grid columns={4} spacing="1u">
            <Button onClick={() => setActiveTab('all')} variant={getButtonVariant('all')} children={translations.all}/>
            <Button onClick={() => setActiveTab('image')} variant={getButtonVariant('image')} children={translations.images}/>
            <Button onClick={() => setActiveTab('video')} variant={getButtonVariant('video')} children={translations.videos}/>
            <Button onClick={() => setActiveTab('audio')} variant={getButtonVariant('audio')} children={translations.audios}/>
          </Grid>

          {error ? (
          <Text color="error">{error}</Text>
        ) : (
          <MediaUploadList uploads={filteredUploads} />
        )}
      </Rows>
    </div>
  );
};

export default UserUploads;

