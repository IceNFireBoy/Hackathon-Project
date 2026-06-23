(function() {
    (async function() {
  console.log("Omni-Cart: shortsFetcher.js injected successfully.");

  // 1. The Shorts DOM Hunter
  // Shorts pages load multiple video elements. We must find the one actively playing on screen.
  const videos = Array.from(document.querySelectorAll('video'));
  const activeVideo = videos.find(v => !v.paused && v.readyState >= 2) || videos[0];

  if (!activeVideo) {
    console.error("Omni-Cart: No active video found.");
    alert("Omni-Cart: Please play the video for a second so we can scan it.");
    return;
  }

  console.log("Omni-Cart: Active Shorts video located. Extracting visual data...");

  // 2. Setup the Canvas (Vertical aspect ratio for Shorts)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  // 360x640 keeps the payload lightweight so Chrome's messaging port doesn't crash
  canvas.width = 360; 
  canvas.height = 640;

  const frames = [];
  const frameCount = 3; // Grab 3 frames to give the AI visual context

  // 3. Extract Frames over time
  for (let i = 0; i < frameCount; i++) {
    // Draw the current video frame to the canvas
    ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
    
    // Compress as JPEG to keep the Base64 string small
    frames.push(canvas.toDataURL("image/jpeg", 0.8)); 
    
    // Wait 400ms between frames to capture a slightly different angle/shot
    if (i < frameCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  console.log(`Omni-Cart: Successfully extracted ${frames.length} frames.`);

  // 4. Fire the payload back to the React UI
  chrome.runtime.sendMessage({
    sourceType: "video_frames",
    data: frames
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Omni-Cart Routing Error:", chrome.runtime.lastError.message);
    } else {
      console.log("Omni-Cart: Payload delivered to popup.");
    }
  });
})();
})();

