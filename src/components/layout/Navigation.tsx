import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, FileText, Users, Plane } from 'lucide-react';

const Navigation = () => {
  const { userRole } = useAuth();

  const ownerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/booking', label: 'Bookings', icon: Calendar },
    { to: '/services', label: 'Services', icon: Plane },
    { to: '/training', label: 'Training', icon: Users },
    { to: '/billing', label: 'Billing', icon: FileText },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/booking', label: 'Schedule', icon: Calendar },
    { to: '/aircraft', label: 'Fleet', icon: Plane },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/billing', label: 'Billing', icon: FileText },
  ];

  const links = userRole === 'admin' ? adminLinks : ownerLinks;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  'border-b-2 border-transparent hover:border-primary/50',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
