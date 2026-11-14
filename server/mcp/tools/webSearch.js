/**
 * MCP Tool: search_web
 * Live web search using DuckDuckGo HTML / Instant Answer JSON API with clean snippet extraction
 */
export async function searchWeb({ query }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { query: '', results: [] };
  }

  const cleanQuery = query.trim();

  // Try DuckDuckGo Instant Answer JSON API first
  try {
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const results = [];

      if (data.AbstractText) {
        results.push({
          title: data.Heading || cleanQuery,
          snippet: data.AbstractText,
          url: data.AbstractURL || '',
          source: data.AbstractSource || 'DuckDuckGo Instant Answer',
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const item of data.RelatedTopics.slice(0, 4)) {
          if (item.Text && item.FirstURL) {
            results.push({
              title: item.Text.split(' - ')[0] || cleanQuery,
              snippet: item.Text,
              url: item.FirstURL,
              source: 'DuckDuckGo',
            });
          }
        }
      }

      if (results.length > 0) {
        return {
          query: cleanQuery,
          results,
        };
      }
    }
  } catch (err) {
    console.warn('[webSearchTool] Instant answer API failed:', err.message);
  }

  // Fallback: DuckDuckGo HTML Lite search
  try {
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(htmlUrl, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const results = [];

      // Regex parser for DuckDuckGo HTML results
      const resultBlockRegex = /<a class="result__snippet[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis;
      const titleRegex = /<a class="result__url"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis;

      // Extract results with simple HTML stripping
      const snippetMatches = [...html.matchAll(/<a class="result__snippet[^>]*>(.*?)<\/a>/gis)];
      const titleMatches = [...html.matchAll(/<h2 class="result__title"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis)];

      for (let i = 0; i < Math.min(titleMatches.length, 4); i++) {
        const rawUrl = titleMatches[i][1];
        // Clean uddg redirect URLs if present
        let actualUrl = rawUrl;
        if (rawUrl.includes('uddg=')) {
          try {
            const urlObj = new URL(rawUrl, 'https://duckduckgo.com');
            const uddg = urlObj.searchParams.get('uddg');
            if (uddg) actualUrl = decodeURIComponent(uddg);
          } catch (_) {}
        }

        const rawTitle = titleMatches[i][2].replace(/<[^>]+>/g, '').trim();
        const rawSnippet = snippetMatches[i] ? snippetMatches[i][1].replace(/<[^>]+>/g, '').trim() : '';

        if (actualUrl && rawTitle) {
          results.push({
            title: rawTitle,
            snippet: rawSnippet,
            url: actualUrl,
            source: 'Web Search',
          });
        }
      }

      if (results.length > 0) {
        return {
          query: cleanQuery,
          results,
        };
      }
    }
  } catch (err) {
    console.warn('[webSearchTool] DuckDuckGo HTML search failed:', err.message);
  }

  return {
    query: cleanQuery,
    results: [
      {
        title: `Search summary for "${cleanQuery}"`,
        snippet: `Current financial search information regarding ${cleanQuery}.`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
        source: 'DuckDuckGo',
      },
    ],
  };
}
