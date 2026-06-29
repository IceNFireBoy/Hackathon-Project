(function() {
    console.log("Omni-Cart: domFetcher.js injected.");

   function extractArticleText() {
   try {
    // 1. Clone the document to avoid mutating the user's actual webpage
    const documentClone = document.cloneNode(true);

    // 2. Define the Readability-style heuristics (tags and classes to strip)
    const noiseSelectors = [
      'nav', 'footer', 'header', 'aside',
      'script', 'style', 'noscript', 'iframe', 'svg',
      'form', '.ad', '.ads', '.advertisement', '#comments',
      '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'
    ];

    // 3. Strip the noise from the cloned DOM
    noiseSelectors.forEach(selector => {
      const elements = documentClone.querySelectorAll(selector);
      elements.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    });

    // 4. Target the core content container
    // Prioritize standard article/main tags, fallback to the stripped body
    let coreContent = documentClone.querySelector('article') 
                   || documentClone.querySelector('main') 
                   || documentClone.body;

    if (!coreContent) {
      throw new Error("No readable content container found.");
    }

    // 5. Extract text and clean up excessive whitespace/newlines
    let extractedText = coreContent.textContent || "";
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    return extractedText;

  } catch (error) {
    console.error("Omni-Cart Extraction Error:", error);
    return "Error: Could not extract document text.";
  }
}

// Execute the extraction sequence
const articleText = extractArticleText();
const sourceTitle = (document.title || '').trim();
console.log(`Omni-Cart: Extraction complete. (${articleText.length} characters, title: "${sourceTitle}")`);

// 6. Send the extracted payload back to the React UI / Background script
chrome.runtime.sendMessage({
  sourceType: 'article',
  data: articleText,
  sourceTitle
});
})();
