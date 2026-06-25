(function() {
  (async function() {
    console.log("Omni-Cart: videoFetcher.js injected successfully.");

    try {
      // 1. The Video DOM Hunter
      // Handles both Watch pages (one video) and Shorts pages (multiple).
      // Find the one actively playing, or fall back to the first available.
      const videos = Array.from(document.querySelectorAll('video'));
      const activeVideo = videos.find(v => !v.paused && v.readyState >= 2) || videos[0];

      if (!activeVideo) {
        throw new Error("No active video found on page.");
      }

      console.log("Omni-Cart: Active video located. Extracting visual data...");

      // 2. Setup the Canvas with dynamic aspect-ratio scaling
      // Cap the longest dimension at 640px to keep payloads lightweight while
      // preserving the original ratio for both landscape (Watch) and portrait (Shorts).
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scale = 640 / Math.max(activeVideo.videoWidth, activeVideo.videoHeight);
      canvas.width  = Math.round(activeVideo.videoWidth  * scale);
      canvas.height = Math.round(activeVideo.videoHeight * scale);

      const frames = [];
      const frameCount = 4; // 4 frames for a wide time-lapse of the maker's hardware

      // 3. Extract frames over time
      for (let i = 0; i < frameCount; i++) {
        // Draw the current video frame to the canvas
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

        // Compress as JPEG to keep the Base64 string small
        frames.push(canvas.toDataURL("image/jpeg", 0.8));

        // Wait 1500ms between frames to simulate a time-lapse across the tutorial
        if (i < frameCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      console.log(`Omni-Cart: Successfully extracted ${frames.length} frames.`);

      // 4. Fire the payload back to the React UI
      chrome.runtime.sendMessage({
        sourceType: "video_frames",
        data: frames
      });

    } catch (error) {
      console.error("Omni-Cart extraction error:", error.message);
      chrome.runtime.sendMessage({ error: error.message });
    }

  })();
})();
