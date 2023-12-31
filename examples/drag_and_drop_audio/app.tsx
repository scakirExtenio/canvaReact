import { Rows, Text } from "@canva/app-ui-kit";
import { upload } from "@canva/asset";
import { AudioContextProvider } from "components/audio_player";
import { DraggableAudio } from "components/draggable_audio";
import React from "react";
import styles from "styles/components.css";

const AUDIO_DURATION_MS = 86_047;

const uploadAudio = async () => {
  const audio = await upload({
    // An alphanumeric string that is unique for each asset. If given the same
    // id, the existing asset for that id will be used instead.
    id: "uniqueAudioIdentifier",
    title: "MP3 Audio Track",
    durationMs: AUDIO_DURATION_MS,
    mimeType: "audio/mp3",
    type: "AUDIO",
    url: "https://www.canva.dev/example-assets/audio-import/audio.mp3",
  });

  return audio;
};

export const App = () => (
  <AudioContextProvider>
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        <Text>
          This example demonstrates how apps can support drag-and-drop of audio.
        </Text>
        <DraggableAudio
          durationMs={AUDIO_DURATION_MS}
          resolveAudioRef={uploadAudio}
          title="MP3 Audio Track"
          previewUrl="https://www.canva.dev/example-assets/audio-import/audio.mp3"
        />
      </Rows>
    </div>
  </AudioContextProvider>
);
