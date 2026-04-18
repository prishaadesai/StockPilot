import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/dashboard/AppSidebar';
import TopBar from '@/components/dashboard/TopBar';
import RightPanel from '@/components/dashboard/RightPanel';
import AIChatbot from '@/components/dashboard/AIChatbot';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PortfolioPanel from '@/components/dashboard/PortfolioPanel';
import WishlistPanel from '@/components/dashboard/WishlistPanel';
import MarketsPanel from '@/components/dashboard/MarketsPanel';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import NewsPanel from '@/components/dashboard/NewsPanel';
import AlertListener from '@/components/dashboard/AlertListener';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Briefcase, Heart, BarChart3, Bell, Newspaper, ChevronRight } from 'lucide-react';

const mobileNavItems = [
  { id: 'dashboard', title: 'Home', icon: LayoutDashboard },
  { id: 'portfolio', title: 'Portfolio', icon: Briefcase },
  { id: 'wishlist', title: 'Wishlist', icon: Heart },
  { id: 'alerts', title: 'Alerts', icon: Bell },
  { id: 'markets', title: 'Markets', icon: BarChart3 },
  { id: 'news', title: 'News', icon: Newspaper },
];

const Dashboard = () => {
  const { user, isDark, fetchPortfolio, fetchWishlist, fetchWallet, fetchAlerts, fetchExchangeRate, activeTab, setActiveTab, alerts } = useStore();
  const navigate = useNavigate();
  const [showRightPanel, setShowRightPanel] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPortfolio();
    fetchWishlist();
    fetchWallet();
    fetchAlerts();
    fetchExchangeRate();
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio': return <PortfolioPanel />;
      case 'wishlist': return <WishlistPanel />;
      case 'markets': return <MarketsPanel />;
      case 'alerts': return <AlertsPanel />;
      case 'news': return <NewsPanel />;
      default: return <DashboardHome />;
    }
  };

  const triggeredAlerts = alerts.filter(a => a.triggered).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <TopBar />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-3 md:p-4">
              {renderContent()}
            </main>

            {/* Desktop right panel */}
            <div className="hidden lg:block">
              <RightPanel />
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-1 py-1 safe-area-bottom">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 flex-1 relative transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-primary/10 rounded-xl" />
                )}
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.id === 'alerts' && triggeredAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stock-red text-[8px] font-bold text-white">
                      {triggeredAlerts}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.title}
                </span>
              </button>
            );
          })}
          {/* Right panel trigger on mobile */}
          <button
            onClick={() => setShowRightPanel(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 flex-1 relative transition-all text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </nav>

        {/* Mobile right panel drawer */}
        {showRightPanel && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRightPanel(false)}
            />
            <div className="relative ml-auto w-[85vw] max-w-sm h-full bg-card border-l border-border overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
                <span className="font-semibold text-foreground">Market Info</span>
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary"
                >
                  ✕
                </button>
              </div>
              <RightPanel />
            </div>
          </div>
        )}

        <AIChatbot />
        <AlertListener />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
