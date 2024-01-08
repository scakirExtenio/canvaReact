import React from 'react';
import { DraggableImage } from 'components/draggable_image';
import { DraggableVideo } from 'components/draggable_video';
import { DraggableAudio } from 'components/draggable_audio';
import { AudioContextProvider } from 'components/audio_player';
import { addNativeElement } from "@canva/design";
import { upload } from "@canva/asset";
import { Grid, Rows } from '@canva/app-ui-kit';

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
  const audioUrl = `${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(uploadData.key)}`;

  try {
    const audio = await upload({
      id: uploadData._id,
      title: uploadData.title,
      durationMs: uploadData.durationMs,
      mimeType: uploadData.type,
      type: "AUDIO", 
      url: audioUrl,
    });

    return audio;
  } catch (error) {
    console.error('Error getting audio duration:', error);
  }
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

const MediaUploadItem = ({ upload }) => {
  const gridColumnSpan = upload.type.startsWith('audio') ? '1 / -1' : 'auto';

  // Determines how to render each upload based on its type
  switch (upload.type.split('/')[0]) {
    case 'image':
      return (
        <div style={{ gridColumn: gridColumnSpan }}>
          <Rows spacing='1u'>
            <DraggableImage
              src={`${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(upload.key)}`}
              onClick={() => insertExternalImage(upload)}
              resolveImageRef={() => uploadImage(upload)}
              style={{ width: '100px', height: '100px', maxWidth: '130px', objectFit: 'scale-down', justifyContent: 'center', alignItems: 'center' }}
            />
          </Rows>
        </div>

      );
    case 'video':
      return (
        <div style={{ gridColumn: gridColumnSpan }}>
        <Rows spacing='1u'>
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
        </Rows>
        </div>
      );
    case 'audio':
      return (
        <div style={{ gridColumn: gridColumnSpan }}>
        <Rows spacing='1u'>
          <AudioContextProvider>
            <DraggableAudio
              resolveAudioRef={() => uploadAudio(upload)}
              title={upload.title}
              durationMs={upload.durationMs}
              previewUrl={`${ORGINAL_S3BUCKET_URL}/${getOrginalKeyFromFileKey(upload.key)}`}
              style={{ width: '100px', height: '100px', maxWidth: '130px', objectFit: 'scale-down', justifyContent: 'center', alignItems: 'center'}}
            />
          </AudioContextProvider>
        </Rows>
        </div>
      );
    default:
      return null;
  }
};

const MediaUploadList = ({ uploads }) => {
  return (
    <Grid columns={3} spacing="1.5u">
      {uploads.map((upload) => (
          <MediaUploadItem upload={upload} />
      ))}
    </Grid>
  );
};

export default MediaUploadList;
