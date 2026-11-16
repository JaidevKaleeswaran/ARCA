import { useEffect, useState, useRef } from 'react';
import { X, ExternalLink, Clock, Newspaper, Share2, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ArticleReaderModal({ article, isOpen, onClose }) {
  const [iframeError, setIframeError] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    setIframeError(false);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !article) return null;

  const articleUrl = article.link || article.canonicalUrl || '';

  const handleCopyLink = () => {
    if (articleUrl) {
      navigator.clipboard.writeText(articleUrl);
      toast.success('Live article link copied to clipboard!');
    }
  };

  const getSourceBadgeColor = (source) => {
    const s = (source || '').toLowerCase();
    if (s.includes('bloomberg')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (s.includes('reuters')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (s.includes('wall street journal') || s.includes('wsj')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (s.includes('financial times') || s.includes('ft')) return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
    if (s.includes('cnbc')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (s.includes('yahoo')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl h-[88vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between gap-3 bg-card-hover shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getSourceBadgeColor(article.source)}`}>
              {article.source}
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Clock size={12} />
              {article.timeAgo || 'Live'}
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[280px] sm:max-w-md hidden md:inline">
              {article.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {articleUrl && (
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-primary text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <span>Open in New Tab</span>
                <ExternalLink size={13} />
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy article link"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Headline Notice */}
        <div className="px-5 py-2.5 bg-[#141412] border-b border-border/60 flex items-center justify-between text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Globe size={14} className="text-accent shrink-0" />
            <span className="font-semibold text-white truncate">{article.title}</span>
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0 ml-2">Live Web View</span>
        </div>

        {/* Embedded Live Web View */}
        <div className="relative flex-1 w-full bg-[#111110] overflow-hidden">
          {articleUrl ? (
            <>
              <iframe
                src={articleUrl}
                title={article.title}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="w-full h-full border-0"
                onError={() => setIframeError(true)}
              />

              {/* Informational overlay for publishers that block iframe embedding */}
              <div className="absolute bottom-4 right-4 bg-card/95 border border-border p-3 rounded-xl shadow-xl max-w-sm flex items-center justify-between gap-3 text-xs backdrop-blur-md">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-text-muted text-[11px] leading-tight">
                    If {article.source} restricts in-app embedding, open directly in your browser.
                  </p>
                </div>
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-card-hover hover:bg-accent hover:text-primary text-accent text-[11px] font-bold rounded-lg border border-accent/30 transition-all shrink-0 cursor-pointer"
                >
                  Direct View ↗
                </a>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-3 p-6 text-center">
              <Newspaper size={36} className="text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-300">Article URL unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
