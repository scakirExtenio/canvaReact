import React, { useState, useEffect } from 'react';
import { auth } from "@canva/user";
import { DraggableImage } from 'components/draggable_image';
import { DraggableVideo } from 'components/draggable_video';
import { addNativeElement } from "@canva/design";
import { upload } from "@canva/asset";

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

const s3Bucket = "https://files-dev.sep7.tv";
const s3BucketThumbnail = "https://thumbnails-dev.sep7.tv";
const defaultVideoThumbnailSrc = "https://files-dev.sep7.tv/RsccfRmX6fXMzZ48k/2d11673150518611/original.jpeg"
const uploadImage = async (uploadData) => {
  console.log(uploadData.type);
  
  const image = await upload({
    // An alphanumeric string that is unique for each asset. If given the same
    // id, the existing asset for that id will be used instead.
    id: uploadData._id,
    mimeType: uploadData.type,
    thumbnailUrl: `${s3BucketThumbnail}/${thumbnailKeyFromFileKey(uploadData.key)}`,
    type: "IMAGE",
    url: `${s3Bucket}/${getOrginalKeyFromFileKey(uploadData.key)}`,
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
    thumbnailImageUrl: defaultVideoThumbnailSrc,
    thumbnailVideoUrl: `${s3BucketThumbnail}/${thumbnailKeyFromFileKey(uploadData.key)}`,
    type: "VIDEO",
    url: `${s3Bucket}/${getOrginalKeyFromFileKey(uploadData.key)}`,
    width: 100,
    height: 100,
  });

  return video;
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

const UserUploads = ({ canvaId }) => {
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
  }, [canvaId]);

  return (
    <div>
      <h2>User Uploads</h2>
      <div id="library">
        {uploads.map((upload) => (
          <div key={upload._id} style={{ marginRight: '10px', marginBottom: '10px', background: "#fff" }}>
            {upload.type.startsWith('video/') ? (
              <>
                <span style={{ display: 'block', marginBottom: '5px' }}>🎥</span>
                <div className="video-container" style={{ width: '100%', height: '100%'}}>
                  <DraggableVideo
                    thumbnailVideoSrc={`${s3Bucket}/${getOrginalKeyFromFileKey(upload.key)}`}
                    onClick={() => insertExternalImage(upload)}
                    resolveVideoRef={() => getImageRef(upload)}
                    mimeType={upload.type}
                  />
                  <div className="tooltip">{upload.title}</div>
                </div>
              </>
            ) : (
              <div className="image-container">
                <DraggableImage
                  src={`${s3Bucket}/${getOrginalKeyFromFileKey(upload.key)}`}
                  style={{ width: "100%", height: "100%", borderRadius: "8px", background: "#fff", padding: "16px" }}
                  onClick={() => insertExternalImage(upload)}
                  resolveImageRef={() => getImageRef(upload)}
                />
                <div className="tooltip">{upload.title}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserUploads;

