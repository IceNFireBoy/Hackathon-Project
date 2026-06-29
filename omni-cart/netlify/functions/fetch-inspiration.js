exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const query = payload.query?.trim();

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No query provided.' }),
      };
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
    const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;

    const fetchYouTube = async () => {
      if (!YOUTUBE_API_KEY) return [];
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.substring(0, 120) || `YouTube API returned ${response.status}`);
      }
      const data = await response.json();
      return (data.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    };

    const fetchArticles = async () => {
      if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_CX) return [];
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_CX}&num=6&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.substring(0, 120) || `Google CSE returned ${response.status}`);
      }
      const data = await response.json();
      return (data.items || []).map((item) => ({
        id: item.cacheId || item.link,
        title: item.title,
        snippet: item.snippet,
        source: item.displayLink,
        url: item.link,
        thumbnailUrl:
          item.pagemap?.cse_thumbnail?.[0]?.src ||
          item.pagemap?.cse_image?.[0]?.src ||
          null,
      }));
    };

    const [videosResult, articlesResult] = await Promise.allSettled([
      fetchYouTube(),
      fetchArticles(),
    ]);

    const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
    const articles = articlesResult.status === 'fulfilled' ? articlesResult.value : [];

    if (videosResult.status === 'rejected') {
      console.error('[fetch-inspiration] YouTube failure:', videosResult.reason);
    }
    if (articlesResult.status === 'rejected') {
      console.error('[fetch-inspiration] CSE failure:', articlesResult.reason);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ videos, articles }),
    };
  } catch (error) {
    console.error('[fetch-inspiration] Failure:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
