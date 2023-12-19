import React, { useState, useEffect } from 'react';
import { auth } from "@canva/user";
import { DraggableImage } from 'components/draggable_image';
import { DraggableVideo } from 'components/draggable_video';
import { addNativeElement } from "@canva/design";
import { upload } from "@canva/asset";
import { Rows, Text, Title } from "@canva/app-ui-kit";
import { DraggableAudio } from 'components/draggable_audio';
import { AudioContextProvider } from 'components/audio_player';

const getOrginalKeyFromFileKey = (key) => {
  const index_slash = key.lastIndexOf('/');
  const index_dot = key.lastIndexOf('.');
  const extension = key.substring(index_dot, key.length);

  const orginalKeyFromFileKey = key.substring(0, index_slash + 1) + 'original' + extension;
  return orginalKeyFromFileKey
}

const thumbnailKeyFromFileKey = (key) => {
  const index_slash = key.lastIndexOf('/');
  const index_dot = key.lastIndexOf('.');
  let extension = key.substring(index_dot, key.length);
  if ((extension === '.gif') || (extension === '.svg') || (extension === '.pdf')) {
    // rewrite .gif (and .svg) to .png because thumbnails from .gif (and .svg) images are created in .png format
    // rewrite .pdf to .png because thumbnails from .pdf files are created in .png format
    extension = '.png';
  }

  return key.substring(0, index_slash + 1) + 'thumbnail-sm' + extension;
}



const uploadImage = async (uploadData) => {
  const image = await upload({
    // An alphanumeric string that is unique for each asset. If given the same
    // id, the existing asset for that id will be used instead.
    id: uploadData._id,
    mimeType: uploadData.type,
    thumbnailUrl: `${THUMBNAIL_S3BUCKET_URL}/${thumbnailKeyFromFileKey(uploadData.key)}`,
    type: "IMAGE",
    url: `${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(uploadData.key)}`,
    width: 100,
    height: 100,
  });

  return image;
};

const uploadVideo = async (uploadData) => {
  const video = await upload({
    // An alphanumeric string that is unique for each asset. If given the same
    // id, the existing asset for that id will be used instead.
    id: uploadData._id,
    mimeType: uploadData.type,
    thumbnailImageUrl: `${DEFAULT_VIDEO_THUMBNAIL}`,
    thumbnailVideoUrl: `${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(uploadData.key)}`,
    type: "VIDEO",
    url: `${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(uploadData.key)}`,
    width: 100,
    height: 100,
  });

  return video;
};

const uploadAudio = async (uploadData) => {
  const audio = await upload({
    id: uploadData._id,
    title: uploadData.title,
    durationMs: 5,
    mimeType: uploadData.type,
    type: "AUDIO", 
    url: `${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(uploadData.key)}`,
  });

  return audio;
};

const insertExternalImage = async (upload) => {
  if (upload.type.startsWith('image/')) {
    const { ref } = await uploadImage(upload);

    addNativeElement({ type: "IMAGE", ref });
  } 

  if (upload.type.startsWith('video/')) {
    const { ref } = await uploadVideo(upload);

    addNativeElement({ type: "VIDEO", ref });
  } 
};

const UserUploads = () => {
  const [uploads, setUploads] = useState([]);
  
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
        setUploads(data.uploads);
      } catch (error) {
        console.error('Error fetching user uploads:', error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>User Uploads</h2>
      <div id="library" style={{ display: 'flex', flexWrap: 'wrap'}}>
          {uploads.map((upload) => (
            <div key={upload._id} id="libraryParent" style={{ display: 'flex', flexWrap: 'wrap', width: '50%', justifyContent: 'center',}}>
                {upload.type.startsWith('video/') ? (
                  <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', alignItems: 'center'}}>
                    <DraggableVideo
                      thumbnailImageSrc={`${DEFAULT_VIDEO_THUMBNAIL}`}
                      onClick={() => insertExternalImage(upload)}
                      style={{ width: '100px', height: '100px', objectFit: 'scale-down', justifyContent: 'center', alignItems: 'center' }}
                      resolveVideoRef={() => uploadVideo(upload)}
                      mimeType={upload.type}
                      fullSize={{
                        width: 50,
                        height: 50,
                      }}
                    />
                    <span style={{ width: '40%', color: 'white', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', padding: '0.5rem 1.5rem 0.5rem 1.5rem'}}>{upload.title}</span>
                  </div>
                ) : upload.type.startsWith('audio/') ? (
                  <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', alignItems: 'center'}}>
                    <AudioContextProvider>
                      <DraggableAudio 
                        resolveAudioRef={() => uploadAudio(upload)}
                        title={upload.title}
                        durationMs={5}
                        previewUrl={`${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(upload.key)}`}
                        style={{ width: '100px', height: '100px', maxWidth: '130px', objectFit: 'scale-down', justifyContent: 'center', alignItems: 'center'}}
                      />
                    </AudioContextProvider>
                    <span style={{ width: '40%', color: 'white', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', padding: '0.5rem 1.5rem 0.5rem 1.5rem'}}>{upload.title}</span>
                   </div>
                ) : (
                  <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', alignItems: 'center'}}>
                    <DraggableImage
                      src={`${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(upload.key)}`}
                      onClick={() => insertExternalImage(upload)}
                      resolveImageRef={() => uploadImage(upload)}
                      style={{ width: '100px', height: '100px', maxWidth: '130px', objectFit: 'scale-down', justifyContent: 'center', alignItems: 'center' }}
                    />
                    <span style={{ width: '40%', color: 'white', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', padding: '0.5rem 1.5rem 0.5rem 1.5rem'}}>{upload.title}</span>
                  </div>
                )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default UserUploads;

