import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from './utils';
import { 
  Home, Package, Truck, ClipboardList, Settings, Menu, X, 
  LogOut, User, Building2, Shield, ChevronDown, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        setUserDetails(userData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  // Determine navigation based on user type
  const getNavigation = () => {
    const userType = userDetails?.user_type || 'customer';
    const isAdmin = user?.role === 'admin';

    if (isAdmin) {
      return [
        { name: 'Dashboard', href: createPageUrl('AdminDashboard'), icon: Home },
        { name: 'Suppliers', href: createPageUrl('AdminSuppliers'), icon: Building2 },
        { name: 'Bookings', href: createPageUrl('AdminBookings'), icon: ClipboardList },
        { name: 'Extras', href: createPageUrl('AdminExtras'), icon: Package },
        { name: 'Support', href: createPageUrl('AdminSupport'), icon: Shield },
      ];
    }

    if (userType === 'supplier' || userType === 'supplier_manager') {
      return [
        { name: 'Dashboard', href: createPageUrl('SupplierDashboard'), icon: Home },
        { name: 'Jobs', href: createPageUrl('SupplierJobs'), icon: ClipboardList },
        { name: 'Profile', href: createPageUrl('SupplierProfile'), icon: Building2 },
      ];
    }

    return [
      { name: 'Home', href: createPageUrl('Home'), icon: Home },
      { name: 'My Moves', href: createPageUrl('MyMoves'), icon: Truck },
      { name: 'New Move', href: createPageUrl('CreateMove'), icon: Package },
    ];
  };

  const navigation = getNavigation();
  const isPublicPage = ['Home', 'SupplierOnboarding'].includes(currentPageName);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <Truck className="w-12 h-12 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/';
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl tracking-tight">House Moves</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    currentPageName === item.name.replace(' ', '')
                      ? "bg-gray-100 text-black"
                      : "text-gray-600 hover:text-black hover:bg-gray-50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium">
                          {user.full_name || user.email}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Profile')} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Settings')} className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleLogin}>
                    Sign in
                  </Button>
                  <Button onClick={handleLogin} className="bg-black text-white hover:bg-gray-800">
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    currentPageName === item.name.replace(' ', '')
                      ? "bg-gray-100 text-black"
                      : "text-gray-600 hover:text-black hover:bg-gray-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">House Moves</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to={createPageUrl('Terms')} className="hover:text-black transition-colors">
                Terms & Conditions
              </Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-black transition-colors">
                Privacy Policy
              </Link>
              <Link to={createPageUrl('Support')} className="hover:text-black transition-colors">
                Support
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 House Moves. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}