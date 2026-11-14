import { REAL_ARTICLES } from '../../../src/data/marketData.js';

const ALLOWED_DOMAINS = [
  'bloomberg.com',
  'reuters.com',
  'wsj.com',
  'cnbc.com',
  'ft.com',
  'barrons.com',
  'marketwatch.com',
];

function isAllowlistedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function calculateReadingTime(text) {
  if (!text) return '3 min read';
  const words = String(text).trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Validates that an article meets all strict journalism requirements
 */
function validateArticle(article) {
  const headline = article.title || article.headline;
  const publisher = article.source || article.publisher;
  const publishedAt = article.publishedAt;
  const url = article.canonicalUrl || article.link || article.url;

  if (!headline || typeof headline !== 'string' || !headline.trim()) return null;
  if (!publisher || typeof publisher !== 'string' || !publisher.trim()) return null;
  if (!publishedAt || typeof publishedAt !== 'string' || isNaN(Date.parse(publishedAt))) return null;
  if (!isAllowlistedUrl(url)) return null;

  const readingTime = article.readTime || article.readingTime || calculateReadingTime(
    Array.isArray(article.fullContent) ? article.fullContent.join(' ') : (article.snippet || headline)
  );

  return {
    headline: headline.trim(),
    publisher: publisher.trim(),
    publishedAt: new Date(publishedAt).toISOString(),
    readingTime,
    url: url.trim(),
    snippet: article.snippet || '',
    category: article.category || 'Financial Markets',
  };
}

/**
 * MCP Tool: search_financial_news
 * Enforces strict market-data-and-news-ux.md guidelines
 */
export async function searchFinancialNews({ topic = 'general', limit = 5 } = {}) {
  const normalizedTopic = (topic || 'general').toLowerCase().trim();
  const maxLimit = Math.min(Math.max(1, Number(limit) || 5), 10);

  // Filter curated authentic articles
  let matches = REAL_ARTICLES;
  if (normalizedTopic && normalizedTopic !== 'general' && normalizedTopic !== 'all') {
    const q = normalizedTopic;
    matches = REAL_ARTICLES.filter(art => {
      const title = (art.title || '').toLowerCase();
      const snippet = (art.snippet || '').toLowerCase();
      const cat = (art.category || '').toLowerCase();
      return title.includes(q) || snippet.includes(q) || cat.includes(q);
    });

    if (matches.length === 0) {
      matches = REAL_ARTICLES;
    }
  }

  // Strictly validate each article against allowlist and required metadata
  const validated = matches
    .map(validateArticle)
    .filter(Boolean)
    .slice(0, maxLimit);

  return {
    topic: normalizedTopic,
    count: validated.length,
    articles: validated,
  };
}
