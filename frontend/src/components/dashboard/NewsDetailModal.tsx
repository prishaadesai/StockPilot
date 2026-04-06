import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    title: string;
    source: string;
    time: number;
    link: string;
    thumbnail: string | null;
    summary: string;
    description?: string;
  } | null;
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ isOpen, onClose, article }) => {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && article?.link) {
      setLoading(true);
      setError(null);
      setFullContent(null);
      
      // Call the new extraction API with additional metadata for AI-backed reconstruction
      const fetchParams = {
        params: {
          url: article.link,
          title: article.title,
          summary: article.summary || article.description || ""
        }
      };
      
      api.get('/news/article', fetchParams)
      .then(res => {
        const data = res.data;
        if (data.success) {
          setFullContent(data.content);
        } else {
          setError(data.error || 'Failed to extract full story.');
        }
      })
      .catch(() => {
        setError('Connection error while fetching article.');
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, article]);

  if (!article) return null;

  const dateStr = new Date(article.time * 1000).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = new Date(article.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
          >
            {/* Header / Banner */}
            <div className="relative h-48 md:h-64 shrink-0 overflow-hidden">
              {article.thumbnail ? (
                <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-16 w-16 text-primary/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                 <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg max-w-fit">
                  {article.source}
                </span>
                <span className="px-3 py-1 bg-background/80 backdrop-blur-sm text-[10px] font-bold text-foreground rounded-full uppercase tracking-wider border border-border mt-1 max-w-fit">
                  Verified Intelligence
                </span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onClose} 
                className="absolute top-6 right-6 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-secondary z-20 shadow-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 custom-scrollbar relative">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {dateStr}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {timeStr}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-foreground leading-[1.2] tracking-tight">
                    {article.title}
                  </h2>
                </div>

                <div className="border-t border-border pt-10">
                  {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <BookOpen className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xl font-black text-foreground uppercase tracking-widest">Decrypting Coverage...</p>
                        <p className="text-sm text-muted-foreground">Extracting high-resolution intelligence from source.</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-10 rounded-3xl bg-secondary/20 border border-border text-center space-y-4 shadow-inner">
                      <div className="h-12 w-12 bg-stock-red/10 rounded-2xl flex items-center justify-center mx-auto">
                         <Globe className="h-6 w-6 text-stock-red opacity-50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground font-black uppercase tracking-tight">Source Access Restricted</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          This publisher has restricted automated reading. However, you can see the summary above and the full story by visiting their official channel below.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button onClick={() => window.open(article.link, '_blank')} className="gap-2 bg-primary font-bold shadow-lg shadow-primary/20">
                           Read Full Story on {article.source}
                        </Button>
                      </div>
                    </div>
                  ) : fullContent ? (
                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-foreground/90 prose-p:leading-relaxed prose-img:rounded-2xl prose-img:shadow-lg pb-10">
                      <ReactMarkdown>{fullContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                       <p className="italic text-muted-foreground">{article.summary}</p>
                    </div>
                  )}
                </div>

                <div className="h-20" /> {/* Spacer */}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-card/50 backdrop-blur-sm flex justify-center sticky bottom-0">
               <Button 
                onClick={onClose}
                className="h-12 px-12 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20"
              >
                Done Reading
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewsDetailModal;
