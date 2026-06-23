// youtubeFetcher.js
console.log("Omni-Cart: youtubeFetcher.js injected.");

function startVideoSampling() {
  const video = document.querySelector('video');
  
  if (!video) {
    console.error("Omni-Cart: No video element found.");
    chrome.runtime.sendMessage({ error: "No video found on page." });
    return;
  }

  // Ensure OpenCV is available in the content script environment
  if (typeof cv === 'undefined') {
    console.error("Omni-Cart: OpenCV.js is not loaded.");
    chrome.runtime.sendMessage({ error: "Computer Vision library missing." });
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  let frames = [];
  let sampleCount = 0;
  const MAX_SAMPLES = 6; // Stop after 30 seconds (6 samples) to return data quickly

  console.log("Omni-Cart: Starting 5-second interval sampling...");

  const intervalId = setInterval(() => {
    // Stop if video is paused or ended
    if (video.paused || video.ended) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 1. Capture the frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8); // 0.8 compression to save payload size
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 2. OpenCV Sharpness Calculation
    let src = cv.matFromImageData(imageData);
    let gray = new cv.Mat();
    let lap = new cv.Mat();
    let mean = new cv.Mat();
    let stddev = new cv.Mat();

    try {
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      // Apply Laplacian filter
      cv.Laplacian(gray, lap, cv.CV_64F);
      // Calculate standard deviation
      cv.meanStdDev(lap, mean, stddev);
      
      // Variance = Standard Deviation squared
      let stdevValue = stddev.doubleAt(0, 0);
      let variance = stdevValue * stdevValue;

      frames.push({ variance: variance, image: base64Image });
      console.log(`Frame ${sampleCount + 1} captured. Sharpness score: ${variance.toFixed(2)}`);

    } catch (err) {
      console.error("OpenCV Processing Error:", err);
    } finally {
      // CRITICAL: Prevent memory leaks by explicitly deleting matrices
      src.delete(); gray.delete(); lap.delete(); mean.delete(); stddev.delete();
    }

    sampleCount++;

    // 3. Evaluate and send payload
    if (sampleCount >= MAX_SAMPLES) {
      clearInterval(intervalId);
      
      // Sort descending (highest variance = sharpest)
      frames.sort((a, b) => b.variance - a.variance);
      
      // Keep only top 3
      const top3Frames = frames.slice(0, 3).map(f => f.image);
      
      console.log("Omni-Cart: Sampling complete. Dispatching top 3 frames to UI.");
      
      chrome.runtime.sendMessage({
        sourceType: 'video_frames',
        data: top3Frames
      });
    }

  }, 5000); // 5000ms = 5 seconds
}

// Kick off the sequence
startVideoSampling();