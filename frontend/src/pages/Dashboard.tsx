import { useEffect } from 'react';
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

const Dashboard = () => {
  const { user, isDark, fetchPortfolio, fetchWishlist, fetchWallet, fetchAlerts, fetchExchangeRate, activeTab, setActiveTab } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Fetch all data from backend on mount
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4">
              {renderContent()}
            </main>

            <RightPanel />
          </div>
        </div>

        <AIChatbot />
        <AlertListener />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
