import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/segments': 'Segments',
  '/campaigns': 'Campaigns',
  '/ai-assistant': 'Tara Intelligence',
  '/analytics': 'Analytics',
};

const pageDescriptions: Record<string, string> = {
  '/': 'Monitor customer engagement, campaign performance, and growth metrics.',
  '/customers': 'View customer profiles, orders, and engagement history.',
  '/segments': 'Organize customers into targeted audiences for personalized campaigns.',
  '/campaigns': 'Create, manage, and analyze customer outreach campaigns.',
  '/ai-assistant': 'Ask Tara to discover audiences, generate segments, and launch campaigns from customer data.',
  '/analytics': 'Measure campaign delivery, engagement, and attributed conversions.',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/campaigns/')) {
    return 'Campaign Detail';
  }
  return pageTitles[pathname] ?? 'XenoCRM';
}

function getPageDescription(pathname: string): string | undefined {
  if (pathname.startsWith('/campaigns/')) {
    return 'Track delivery, engagement, and attributed conversions.';
  }
  return pageDescriptions[pathname];
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const description = getPageDescription(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[240px]">
        <Header title={title} description={description} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
