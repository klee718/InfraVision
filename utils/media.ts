/**
 * Extracts a few frames from a video file to send to the Vision API.
 * This is a client-side workaround to avoid sending massive video files.
 */
export const extractFramesFromVideo = async (videoFile: File, numFrames: number = 3): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const interval = duration / (numFrames + 1);
      
      canvas.width = video.videoWidth / 2; // Resize to reduce payload
      canvas.height = video.videoHeight / 2;

      for (let i = 1; i <= numFrames; i++) {
        video.currentTime = interval * i;
        await new Promise<void>(r => {
            const seeked = () => {
                video.removeEventListener('seeked', seeked);
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]); // Get base64 data only
                }
                r();
            };
            video.addEventListener('seeked', seeked);
        });
      }
      URL.revokeObjectURL(objectUrl);
      resolve(frames);
    };

    video.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
    }
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};