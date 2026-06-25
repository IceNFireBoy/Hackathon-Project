(function () {
  console.log('Omni-Cart: youtubeFetcher.js injected.');

  let payloadSent = false;

  function dispatchError(message) {
    if (payloadSent) return;
    payloadSent = true;
    console.error('Omni-Cart:', message);
    chrome.runtime.sendMessage({ error: message }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Omni-Cart error dispatch:', chrome.runtime.lastError.message);
      }
    });
  }

  function dispatchPayload(frames) {
    if (payloadSent) return;
    if (!frames || frames.length === 0) {
      dispatchError('No usable video frames captured.');
      return;
    }
    payloadSent = true;
    console.log('Omni-Cart: Dispatching', frames.length, 'frame(s) to extension UI.');
    chrome.runtime.sendMessage(
      { sourceType: 'video_frames', data: frames },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('Omni-Cart payload dispatch:', chrome.runtime.lastError.message);
        }
      }
    );
  }

  function waitForOpenCvReady(onReady, onFail, attempt = 0) {
    try {
      if (typeof cv !== 'undefined') {
        if (cv.Mat) {
          onReady();
          return;
        }
        cv.onRuntimeInitialized = () => {
          try {
            onReady();
          } catch (err) {
            onFail(`OpenCV runtime init failed: ${err.message}`);
          }
        };
        return;
      }
    } catch (err) {
      onFail(`OpenCV check failed: ${err.message}`);
      return;
    }

    if (attempt >= 80) {
      onFail('Computer Vision library missing or timed out.');
      return;
    }

    setTimeout(() => waitForOpenCvReady(onReady, onFail, attempt + 1), 250);
  }

  function scoreFrame(imageData) {
    let src = cv.matFromImageData(imageData);
    let gray = new cv.Mat();
    let lap = new cv.Mat();
    let mean = new cv.Mat();
    let stddev = new cv.Mat();

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.Laplacian(gray, lap, cv.CV_64F);
      cv.meanStdDev(lap, mean, stddev);
      const stdevValue = stddev.doubleAt(0, 0);
      return stdevValue * stdevValue;
    } finally {
      src.delete();
      gray.delete();
      lap.delete();
      mean.delete();
      stddev.delete();
    }
  }

  async function captureFrame(video, canvas, ctx) {
    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const variance = scoreFrame(imageData);
      return { variance, image: base64Image };
    } catch (err) {
      console.warn('Omni-Cart frame scoring fallback:', err.message);
      return { variance: 0, image: base64Image };
    }
  }

  async function startVideoSampling() {
    const wallTimeout = setTimeout(() => {
      dispatchError('Video sampling timed out. Ensure the video is playing and try again.');
    }, 25000);

    try {
      const video = document.querySelector('video');

      if (!video) {
        clearTimeout(wallTimeout);
        dispatchError('No video found on page.');
        return;
      }

      if (video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const readyTimeout = setTimeout(() => reject(new Error('Video not ready.')), 8000);
          video.addEventListener('loadeddata', () => {
            clearTimeout(readyTimeout);
            resolve();
          }, { once: true });
        }).catch((err) => {
          clearTimeout(wallTimeout);
          dispatchError(err.message);
        });
        if (payloadSent) return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const frames = [];
      const TARGET_SAMPLES = 4;
      const INTERVAL_MS = 1500;

      console.log('Omni-Cart: Starting adaptive frame sampling…');

      for (let i = 0; i < TARGET_SAMPLES; i += 1) {
        if (payloadSent) return;

        const frame = await captureFrame(video, canvas, ctx);
        if (frame) {
          frames.push(frame);
          console.log(`Frame ${i + 1} captured. Sharpness: ${frame.variance.toFixed(2)}`);
        }

        if (i < TARGET_SAMPLES - 1) {
          await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
        }
      }

      clearTimeout(wallTimeout);

      if (frames.length === 0) {
        dispatchError('Could not capture frames from the video player.');
        return;
      }

      frames.sort((a, b) => b.variance - a.variance);
      const top3Frames = frames.slice(0, 3).map((f) => f.image);
      dispatchPayload(top3Frames);
    } catch (err) {
      clearTimeout(wallTimeout);
      dispatchError(`Video sampling failed: ${err.message}`);
    }
  }

  waitForOpenCvReady(
    () => {
      try {
        startVideoSampling();
      } catch (err) {
        dispatchError(`Sampler crashed: ${err.message}`);
      }
    },
    dispatchError
  );
})();
