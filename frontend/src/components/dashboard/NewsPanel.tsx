import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Globe, TrendingUp, Search, Calendar, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { newsAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import NewsDetailModal from './NewsDetailModal';

const NewsPanel = () => {
  const { selectedMarket: globalMarket } = useStore();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [localMarket, setLocalMarket] = useState<"US" | "India" | "Crypto">((globalMarket as "US" | "India" | "Crypto") || 'US');

  useEffect(() => {
    setLoading(true);
    newsAPI.get(localMarket).then(({ data }) => {
      setNews(data || []);
    }).catch(() => {
      setNews([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [localMarket]);

  const markets: Array<{ id: "US" | "India" | "Crypto"; label: string; icon: string }> = [
    { id: 'US', label: 'Wall Street', icon: '🇺🇸' },
    { id: 'India', label: 'Dalal Street', icon: '🇮🇳' },
    { id: 'Crypto', label: 'Crypto', icon: '₿' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-primary/5 rounded-[2rem] border border-primary/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen className="h-48 w-48 text-primary" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
              Intelligence <span className="text-primary italic">Terminal</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Real-time Market News, curated from global verified sources. Read full-text articles directly in StockPilot.
            </p>
          </div>

          {/* Market Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {markets.map((m) => (
              <button
                key={m.id}
                onClick={() => setLocalMarket(m.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-lg ${
                  localMarket === m.id 
                    ? 'bg-primary text-primary-foreground border-primary shadow-primary/20 scale-105' 
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                <span className="text-lg">{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-[1.5rem] border border-border h-[420px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {news.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-[1.5rem] border border-border overflow-hidden hover:border-primary/40 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer flex flex-col h-full"
              onClick={() => setSelectedArticle(item)}
            >
              <div className="h-56 w-full relative overflow-hidden">
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                    <Newspaper className="h-14 w-14 text-muted-foreground opacity-20" />
                  </div>
                )}
                <div className="absolute top-5 left-5">
                  <span className="px-3 py-1.5 bg-background/90 backdrop-blur-md text-[9px] font-black text-foreground rounded-xl border border-border shadow-xl uppercase tracking-[0.1em]">
                    {item.source}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-primary mb-4 opacity-70">
                  <Clock className="h-3.5 w-3.5" /> Just Recieved
                </div>
                <h3 className="text-xl font-bold text-foreground leading-[1.4] line-clamp-3 group-hover:text-primary transition-colors tracking-tight">
                  {item.title}
                </h3>
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-border/50 group-hover:border-primary/20 transition-colors">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] flex items-center gap-1.5">
                    Terminal Read <ChevronRight className="h-3 w-3" />
                  </span>
                   <Button variant="ghost" size="sm" className="h-8 px-4 rounded-lg bg-primary/5 text-primary font-bold text-[10px] uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-transparent group-hover:border-primary shadow-sm hover:shadow-primary/20">
                    Open Story
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {news.length === 0 && !loading && (
        <div className="text-center py-32 bg-secondary/10 rounded-[2rem] border border-dashed border-border mx-2">
          <Search className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-foreground">Satellite Down</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-3 text-lg">
            No active intelligence found for the <strong>{markets.find(m => m.id === localMarket)?.label}</strong> region right now. 🪐
          </p>
          <Button onClick={() => setLocalMarket('US')} variant="link" className="mt-4 text-primary font-bold">Switch to Global News Hub</Button>
        </div>
      )}

      <NewsDetailModal 
        isOpen={!!selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
        article={selectedArticle ? {
          ...selectedArticle,
          summary: selectedArticle.summary || selectedArticle.description || ""
        } : null}
      />
    </div>
  );
};

export default NewsPanel;
