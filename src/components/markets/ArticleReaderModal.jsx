import React, { useEffect } from 'react';
import { X, ExternalLink, Clock, Newspaper, BookOpen, ShieldCheck, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ArticleReaderModal({ article, isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const handleCopyLink = () => {
    if (article.canonicalUrl) {
      navigator.clipboard.writeText(article.canonicalUrl);
      toast.success('Article link copied to clipboard!');
    }
  };

  const getSourceBadgeColor = (source) => {
    const s = (source || '').toLowerCase();
    if (s.includes('bloomberg')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (s.includes('reuters')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (s.includes('wall street journal') || s.includes('wsj')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (s.includes('financial times') || s.includes('ft')) return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
    if (s.includes('cnbc')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#181816] border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between gap-3 bg-[#1e1c18]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getSourceBadgeColor(article.source)}`}>
              {article.source}
            </span>
            <span className="text-[11px] bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
              {article.category || 'Financial News'}
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Clock size={12} />
              {article.timeAgo || 'Recent'}
            </span>
            {article.readTime && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <BookOpen size={12} />
                {article.readTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Share article link"
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

        {/* Scrollable Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-zinc-200 leading-relaxed text-sm sm:text-base">
          {/* Article Header */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {article.title}
            </h1>

            {article.author && (
              <p className="text-xs text-zinc-400 italic">
                Reported by <span className="text-zinc-300 font-medium">{article.author}</span>
              </p>
            )}
          </div>

          {/* ARCA Budget Impact Callout Box */}
          {article.budgetTakeaway && (
            <div className="bg-[#24211a] border border-[#e7b956]/30 rounded-xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>ARCA Household Budget Takeaway</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-normal">
                {article.budgetTakeaway}
              </p>
            </div>
          )}

          {/* Multi-Paragraph Full Content */}
          <div className="space-y-4 text-zinc-300 text-sm sm:text-[15px] leading-relaxed">
            {Array.isArray(article.fullContent) && article.fullContent.length > 0 ? (
              article.fullContent.map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="leading-relaxed">
                {article.snippet || article.summary || 'Full content preview unavailable.'}
              </p>
            )}
          </div>

          {/* Outbound Canonical Link Section */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
            <div>
              <span>Original Publication: </span>
              <span className="font-semibold text-zinc-200">{article.source}</span>
            </div>

            {article.canonicalUrl && (
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:underline font-semibold"
              >
                <span>Read on {article.source}</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-[#161614] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-card hover:bg-zinc-800 text-zinc-200 border border-border text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
}
