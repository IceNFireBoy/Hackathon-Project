import { useState, useCallback } from 'react';

const isLocal = true;
export const API_BASE_URL = isLocal
  ? 'http://localhost:8888/.netlify/functions'
  : 'https://[YOUR-FUTURE-NETLIFY-URL]/.netlify/functions';

export function useAnalyzeParts() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = useCallback(async (payload) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Server crashed with status ${response.status}`);
        } catch {
          throw new Error(errorText.substring(0, 80) || `Server returned status ${response.status}`);
        }
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyze, isAnalyzing, error, result, reset };
}
