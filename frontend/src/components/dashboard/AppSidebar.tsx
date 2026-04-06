import { LayoutDashboard, Briefcase, Heart, BarChart3, TrendingUp, Bell, Newspaper } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', title: 'Portfolio', icon: Briefcase },
  { id: 'wishlist', title: 'Wishlist', icon: Heart },
  { id: 'alerts', title: 'Alerts', icon: Bell },
  { id: 'markets', title: 'Markets', icon: BarChart3 },
  { id: 'news', title: 'News', icon: Newspaper },
];

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <img src="/logo_pilot.png" alt="StockPilot" className="h-10 w-10 object-contain rounded-lg" />
          {!collapsed && <span className="text-xl font-bold tracking-tight text-foreground">StockPilot</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={activeTab === item.id ? 'bg-primary/10 text-primary font-medium' : ''}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
