import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserPlus,
  FileText,
  FileCheck,
  Package,
  BookOpen,
  BookMarked,
  LogOut,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add padding to main content when using mobile header
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.paddingTop = '72px';  // 56px + 8px + 8px
    }
    return () => {
      if (mainContent) {
        mainContent.style.paddingTop = '';
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      colorClass: 'blue'
    },
    {
      path: '/client-ledger',
      label: t('clientLedger'),
      icon: BookMarked,
      colorClass: 'slate'
    },
    {
      path: '/stock',
      label: t('stockManagement'),
      icon: Package,
      colorClass: 'orange'
    },
    {
      path: '/udhar-challan',
      label: t('udharChallan'),
      icon: FileText,
      colorClass: 'red'
    },
    {
      path: '/jama-challan',
      label: t('jamaChallan'),
      icon: FileCheck,
      colorClass: 'green'
    },
    {
      path: '/challan-book',
      label: t('challanBook'),
      icon: BookOpen,
      colorClass: 'cyan'
    },
    {
      path: '/clients',
      label: t('addClient'),
      icon: UserPlus,
      colorClass: 'blue'
    },
    {
      path: '/billing',
      label: t('billing'),
      icon: FileText,
      colorClass: 'blue'
    },
    {
      path: '/bill-book',
      label: t('billBook'),
      icon: BookOpen,
      colorClass: 'blue'
    },
  ];

  const getActiveColor = (colorClass: string): string => {
    const colors: Record<string, string> = {
      blue: '#2563eb',
      red: '#dc2626',
      green: '#16a34a',
      orange: '#f59e0b',
      cyan: '#0891b2',
      slate: '#475569',
      purple: '#8b5cf6'
    };
    return colors[colorClass] || colors.blue;
  };

  const getCurrentPageName = () => {
    const currentPath = location.pathname;
    const currentNavItem = navItems.find(item => item.path === currentPath);
    if (currentPath === '/stock-history') return t('stockHistory');
    return currentNavItem?.label || t('appName');
  };

  const SidebarContent = () => (
    <>
      <div className="p-4" style={{ height: '80px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 overflow-hidden transition-colors w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20">
            <img
              src={logo}
              alt="Company Logo"
              className="object-contain w-full h-full"
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('appName')}</h1>
            <p className="text-xs" style={{ color: '#9ca3af' }}>{t('Rental_Management')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ path, label, icon: Icon, colorClass }) => {
            const isActive = location.pathname === path;
            const activeColor = getActiveColor(colorClass);

            return (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full gap-3 px-5 py-3 font-medium transition-all"
                style={{
                  fontSize: '16px',
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  borderLeft: isActive ? `4px solid ${activeColor}` : '4px solid transparent',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <Icon size={20} />
                <span className="flex-1 text-left">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex justify-center">
          <LanguageToggle />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors duration-150 rounded-lg bg-red-500/10 hover:bg-red-500/20"
          style={{
            minHeight: '44px',
            color: '#f87171'
          }}
        >
          <LogOut size={20} />
          <span className="font-medium">{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed top-0 left-0 z-50 flex-col hidden h-screen lg:flex" style={{ width: '250px', backgroundColor: '#1f2937' }}>
        <SidebarContent />
      </nav>

      {/* Mobile Header - Slightly lower position with rounded corners */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center px-4 bg-white border-b shadow-sm lg:hidden"
        style={{
          height: '56px',
          borderColor: '#e5e7eb',
          top: '8px',
          margin: '0 8px',
          borderRadius: '8px'
        }}
      >
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -ml-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          style={{ color: '#2563eb' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="mx-auto font-bold" style={{ fontSize: '16px', color: '#1f2937' }}>
          {getCurrentPageName()}
        </h1>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileMenuOpen(false)}
          />

          <nav
            className="fixed top-0 left-0 z-50 flex flex-col h-screen overflow-y-auto lg:hidden"
            style={{
              width: '280px',
              backgroundColor: '#1f2937',
              boxShadow: '4px 0 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease'
            }}
          >
            <SidebarContent />
          </nav>
        </>
      )}
    </>
  );
};

export default Navbar;