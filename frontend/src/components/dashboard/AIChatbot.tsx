import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { suggestedPrompts } from '@/lib/mockData';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "👋 Hi! I'm **StockPilot AI**. I'm here to provide premium market intelligence, portfolio advice, and real-time research. What's on your radar today? 🚀" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { fetchPortfolio, fetchWallet, fetchMe, currency, exchangeRate } = useStore();

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setTyping(true);

    try {
      const history = messages.length > 5 ? messages.slice(-5) : messages.slice(1);
      const { data } = await chatAPI.send(text, history, currency, exchangeRate);
      setMessages((p) => [...p, { role: 'assistant', content: data.reply }]);
      
      if (data.refreshRequired) {
        toast.success("Terminal state synchronized 🔄");
        fetchPortfolio();
        fetchWallet();
        fetchMe();
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.reply || err?.response?.data?.error || "I'm temporarily disconnected from the terminal. 🔌 Let's try again in a moment!";
      setMessages((p) => [...p, { role: 'assistant', content: errorMsg }]);
    } finally {
      setTyping(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Intelligence copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* Premium FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 flex items-center justify-center z-40 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <MessageSquare className="h-7 w-7 text-primary-foreground relative z-10" />
            <div className="absolute top-1 right-1 h-3 w-3 rounded-full bg-stock-green border-2 border-primary group-hover:scale-125 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modern Chat Terminal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[420px] h-[100dvh] md:h-[650px] bg-card/95 backdrop-blur-xl border border-border/50 md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 bg-primary/[0.03] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-stock-green border-2 border-card" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Market Intelligence
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Professional Advisor v2.0</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full hover:bg-secondary transition-colors" 
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1 border border-border/50">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="group relative max-w-[85%]">
                    <div
                      className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none shadow-md shadow-primary/10'
                          : 'bg-secondary/50 border border-border/50 text-foreground rounded-bl-none'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:text-foreground prose-strong:text-primary prose-ul:my-2 prose-li:my-0.5">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                    {m.role === 'assistant' && (
                      <button 
                        onClick={() => copyToClipboard(m.content, i)}
                        className="absolute -right-8 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                       {copiedIndex === i ? <Check className="h-3 w-3 text-stock-green" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <div className="flex gap-3">
                   <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1 border border-border/50">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-secondary/30 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 border border-border/20">
                    {[0, 1, 2].map((d) => (
                      <motion.div
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.5, 1], backgroundColor: ['var(--primary-opacity-40)', 'var(--primary)', 'var(--primary-opacity-40)'] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input Engine */}
            <div className="p-6 pt-2 shrink-0 bg-gradient-to-t from-card to-transparent">
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2">
                  {suggestedPrompts.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="px-3 py-1.5 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 border border-border/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="relative bg-secondary/50 border border-border/50 p-1.5 rounded-2xl flex items-center gap-2 group focus-within:border-primary/50 transition-colors"
              >
                <Input
                  placeholder="Inquire about markets..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm h-10 px-3"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform" 
                  disabled={!input.trim() || typing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
