import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  FileText,
  FileCheck,
  Package,
  BookOpen,
  BookMarked,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import '../styles/wave.css';
import TodayChallans from '../components/TodayChallans';
import JournalSection from '../components/JournalSection';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(t('greeting'));
  }, [t]);

  const quickActions = [
    {
      title: t('udharChallan'),
      description: t('create_rental'),
      icon: FileText,
      path: '/udhar-challan',
      gradient: 'from-red-500 to-red-700',
      hoverGradient: 'hover:from-red-600 hover:to-red-800',
    },
    {
      title: t('jamaChallan'),
      description: t('record_returns'),
      icon: FileCheck,
      path: '/jama-challan',
      gradient: 'from-green-500 to-green-700',
      hoverGradient: 'hover:from-green-600 hover:to-green-800',
    },
    {
      title: t('clientLedger'),
      description: t('track_balances'),
      icon: BookMarked,
      path: '/client-ledger',
      gradient: 'from-indigo-500 to-indigo-700',
      hoverGradient: 'hover:from-indigo-600 hover:to-indigo-800',
    },
    {
      title: t('stockManagement'),
      description: t('manage_inventory'),
      icon: Package,
      path: '/stock',
      gradient: 'from-purple-500 to-purple-700',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-800',
    },
    {
      title: t('addClient'),
      description: t('add_new_clients'),
      icon: UserPlus,
      path: '/clients',
      gradient: 'from-blue-500 to-blue-700',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-800',
    },
    {
      title: t('challanBook'),
      description: t('view_all_challans'),
      icon: BookOpen,
      path: '/challan-book',
      gradient: 'from-teal-500 to-teal-700',
      hoverGradient: 'hover:from-teal-600 hover:to-teal-800'
    },
    {
      title: t('createBill'),
      description: t('createNewBill'),
      icon: FileText,
      path: '/billing',
      gradient: 'from-amber-500 to-amber-700',
      hoverGradient: 'hover:from-amber-600 hover:to-amber-800'
    },
    {
      title: t('billBook'),
      description: t('billingManagement'),
      icon: BookOpen,
      path: '/bill-book',
      gradient: 'from-cyan-500 to-cyan-700',
      hoverGradient: 'hover:from-cyan-600 hover:to-cyan-800'
    }
  ];

  // Get dates for calendar pages
  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = format(today, 'MMM');

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        /* Horizontal 3D Flip Animation for Multiple Pages (Top to Bottom) */
        @keyframes page-flip-horizontal-1 {
          0% {
            transform: perspective(600px) rotateX(0deg);
            z-index: 4;
          }
          25% {
            transform: perspective(600px) rotateX(0deg);
            z-index: 4;
          }
          50% {
            transform: perspective(600px) rotateX(-90deg);
            z-index: 4;
          }
          75% {
            transform: perspective(600px) rotateX(-180deg);
            z-index: 1;
          }
          100% {
            transform: perspective(600px) rotateX(-180deg);
            z-index: 1;
          }
        }

        @keyframes page-flip-horizontal-2 {
          0% {
            transform: perspective(600px) rotateX(0deg) translateZ(-2px);
            z-index: 3;
          }
          35% {
            transform: perspective(600px) rotateX(0deg) translateZ(-2px);
            z-index: 3;
          }
          60% {
            transform: perspective(600px) rotateX(-90deg) translateZ(-2px);
            z-index: 3;
          }
          85% {
            transform: perspective(600px) rotateX(-180deg) translateZ(-2px);
            z-index: 1;
          }
          100% {
            transform: perspective(600px) rotateX(-180deg) translateZ(-2px);
            z-index: 1;
          }
        }

        @keyframes page-flip-horizontal-3 {
          0% {
            transform: perspective(600px) rotateX(0deg) translateZ(-4px);
            z-index: 2;
          }
          45% {
            transform: perspective(600px) rotateX(0deg) translateZ(-4px);
            z-index: 2;
          }
          70% {
            transform: perspective(600px) rotateX(-90deg) translateZ(-4px);
            z-index: 2;
          }
          95% {
            transform: perspective(600px) rotateX(-180deg) translateZ(-4px);
            z-index: 1;
          }
          100% {
            transform: perspective(600px) rotateX(-180deg) translateZ(-4px);
            z-index: 1;
          }
        }

        @keyframes final-reveal-horizontal {
          0% {
            transform: perspective(600px) rotateX(0deg) translateZ(-6px) scale(0.95);
            opacity: 0.8;
          }
          60% {
            transform: perspective(600px) rotateX(0deg) translateZ(-6px) scale(0.95);
            opacity: 0.8;
          }
          100% {
            transform: perspective(600px) rotateX(0deg) translateZ(0px) scale(1);
            opacity: 1;
          }
        }

        .calendar-flip-container {
          position: relative;
          display: inline-block;
          perspective: 1000px;
        }

        .calendar-page-stack {
          position: relative;
          width: fit-content;
          height: fit-content;
          transform-style: preserve-3d;
        }

        .calendar-flip-page {
          position: absolute;
          top: 0;
          left: 0;
          backface-visibility: hidden;
          transform-origin: top center;
          transform-style: preserve-3d;
        }

        .calendar-flip-page-1 {
          animation: page-flip-horizontal-1 3s ease-in-out forwards;
          filter: brightness(1.15) drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .calendar-flip-page-2 {
          animation: page-flip-horizontal-2 3s ease-in-out forwards;
          filter: brightness(1.1) drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15));
        }

        .calendar-flip-page-3 {
          animation: page-flip-horizontal-3 3s ease-in-out forwards;
          filter: brightness(1.05) drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.1));
        }

        .calendar-base-page {
          position: relative;
          animation: final-reveal-horizontal 3s ease-in-out forwards;
          transform-style: preserve-3d;
        }

        /* Calendar Date Card Styling */
        .calendar-date-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 248, 255, 0.9));
          border-radius: 6px;
          padding: 4px 6px;
          min-width: 40px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        .calendar-date-card-mobile {
          min-width: 32px;
          padding: 3px 5px;
          border-radius: 4px;
        }

        .calendar-date-number {
          font-size: 18px;
          font-weight: 700;
          color: #1e40af;
          line-height: 1;
          margin-bottom: 2px;
        }

        .calendar-date-number-mobile {
          font-size: 14px;
          margin-bottom: 1px;
        }

        .calendar-date-month {
          font-size: 9px;
          font-weight: 600;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-date-month-mobile {
          font-size: 7px;
        }

        /* Add page back sides for horizontal flip */
        .calendar-flip-page::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateX(180deg);
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 220, 255, 0.3));
        }
      `}</style>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '13px',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      <Navbar />

      <main className="flex-1 w-full ml-0 overflow-auto lg:ml-64 pt-[56px] lg:pt-0">
        <div className="w-full px-3 py-3 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-8 max-w-7xl">
          {/* Welcome Section - Compact Mobile */}
          <div className="relative p-3 mb-3 overflow-hidden text-white rounded-lg shadow-lg sm:p-5 sm:mb-5 lg:p-8 lg:mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 sm:rounded-xl lg:rounded-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 -mt-12 -mr-12 bg-white rounded-full sm:w-40 sm:h-40 lg:w-64 lg:h-64 sm:-mt-20 sm:-mr-20 lg:-mt-32 lg:-mr-32 opacity-5"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 -mb-10 -ml-10 bg-white rounded-full sm:w-32 sm:h-32 lg:w-48 lg:h-48 sm:-mb-16 sm:-ml-16 lg:-mb-24 lg:-ml-24 opacity-5"></div>
            <div className="relative">
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                <p className="text-xs font-medium text-blue-100 sm:text-sm lg:text-base"><span className="waving-hand">👋</span> {greeting}!</p>
              </div>
              <h1 className="mb-1 sm:mb-1.5 text-xl sm:text-2xl lg:text-4xl font-bold leading-tight">
                {t('appName')}
              </h1>
              <p className="mb-2 text-xs text-blue-100 sm:text-sm lg:text-base sm:mb-0">{t('Manage_your')}</p>

              {/* Mobile Date Display */}
              <div className="flex items-center gap-1.5 mt-2 sm:hidden">
                <div className="calendar-flip-container">
                  <div className="calendar-page-stack">
                    {/* Page 1 - 3 days ago */}
                    <div className="calendar-flip-page calendar-flip-page-1">
                      <div className="calendar-date-card calendar-date-card-mobile">
                        <div className="calendar-date-number calendar-date-number-mobile">{currentDate - 3}</div>
                        <div className="calendar-date-month calendar-date-month-mobile">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Page 2 - 2 days ago */}
                    <div className="calendar-flip-page calendar-flip-page-2">
                      <div className="calendar-date-card calendar-date-card-mobile">
                        <div className="calendar-date-number calendar-date-number-mobile">{currentDate - 2}</div>
                        <div className="calendar-date-month calendar-date-month-mobile">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Page 3 - Yesterday */}
                    <div className="calendar-flip-page calendar-flip-page-3">
                      <div className="calendar-date-card calendar-date-card-mobile">
                        <div className="calendar-date-number calendar-date-number-mobile">{currentDate - 1}</div>
                        <div className="calendar-date-month calendar-date-month-mobile">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Base - Today */}
                    <div className="calendar-base-page">
                      <div className="calendar-date-card calendar-date-card-mobile">
                        <div className="calendar-date-number calendar-date-number-mobile">{currentDate}</div>
                        <div className="calendar-date-month calendar-date-month-mobile">{currentMonth}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium">{format(new Date(), 'yyyy')}</p>
              </div>

              {/* Desktop Date Display */}
              <div className="absolute items-center hidden gap-3 overflow-visible top-3 right-3 sm:flex sm:top-4 sm:right-4 lg:top-6 lg:right-6">
                <div className="text-right">
                  <p className="mb-0.5 text-[10px] sm:text-xs text-blue-100">{t('Todays_Date')}</p>
                  <p className="text-sm font-semibold sm:text-base lg:text-xl">{format(new Date(), 'yyyy')}</p>
                </div>
                <div className="calendar-flip-container">
                  <div className="calendar-page-stack">
                    {/* Page 1 - 3 days ago */}
                    <div className="calendar-flip-page calendar-flip-page-1">
                      <div className="calendar-date-card">
                        <div className="calendar-date-number">{currentDate - 3}</div>
                        <div className="calendar-date-month">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Page 2 - 2 days ago */}
                    <div className="calendar-flip-page calendar-flip-page-2">
                      <div className="calendar-date-card">
                        <div className="calendar-date-number">{currentDate - 2}</div>
                        <div className="calendar-date-month">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Page 3 - Yesterday */}
                    <div className="calendar-flip-page calendar-flip-page-3">
                      <div className="calendar-date-card">
                        <div className="calendar-date-number">{currentDate - 1}</div>
                        <div className="calendar-date-month">{currentMonth}</div>
                      </div>
                    </div>

                    {/* Base - Today */}
                    <div className="calendar-base-page">
                      <div className="calendar-date-card">
                        <div className="calendar-date-number">{currentDate}</div>
                        <div className="calendar-date-month">{currentMonth}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Compact Mobile */}
          <div className="mb-3 sm:mb-5 lg:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-4 lg:mb-6">
              <Activity className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <h2 className="text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">{t('Quick_Actions')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 lg:gap-5">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} ${action.hoverGradient} rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-5 text-white transition-all transform active:scale-[0.97] sm:hover:scale-105 hover:shadow-2xl touch-manipulation`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 transition-transform bg-white rounded-bl-full sm:w-24 sm:h-24 lg:w-28 lg:h-28 opacity-10 group-hover:scale-110"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 lg:p-2.5 bg-white rounded-md sm:rounded-lg bg-opacity-20 backdrop-blur-sm">
                        <action.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                      </div>
                      <ArrowUpRight className="hidden w-4 h-4 transition-opacity opacity-0 sm:block sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:opacity-100" />
                    </div>
                    <h3 className="mb-1 text-sm font-bold leading-tight sm:text-base lg:text-lg">{action.title}</h3>
                    <p className="text-[10px] sm:text-xs text-white text-opacity-90 leading-snug line-clamp-1 sm:line-clamp-none">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Challans */}
          <TodayChallans />

          {/* Journal Section */}
          <JournalSection />

          {/* Recent Activity - Hidden on Mobile */}
          <div className="hidden p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:block sm:p-4 lg:p-6 sm:rounded-xl">
            <div className="flex flex-col items-start justify-between gap-2 mb-3 sm:flex-row sm:items-center sm:gap-0 sm:mb-5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Activity className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <h2 className="text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">{t('recentActivity')}</h2>
              </div>
            </div>
            <div className="py-6 text-center sm:py-8 lg:py-12">
              <div className="inline-flex items-center justify-center w-10 h-10 mb-2 bg-gray-100 rounded-full sm:w-12 sm:h-12 sm:mb-3 lg:w-16 lg:h-16 lg:mb-4">
                <Activity className="w-5 h-5 text-gray-400 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </div>
              <p className="mb-3 text-xs text-gray-500 sm:text-sm sm:mb-4">{t('recentChallansAppear')}</p>
              <div className="flex flex-col justify-center gap-2 sm:flex-row sm:gap-2.5">
                <button
                  onClick={() => navigate('/udhar-challan')}
                  className="w-full px-3 py-2 text-xs font-medium text-white transition-all bg-red-600 rounded-lg sm:w-auto sm:text-sm sm:px-4 hover:bg-red-700 touch-manipulation active:scale-95"
                >
                  {t('createUdhar')}
                </button>
                <button
                  onClick={() => navigate('/jama-challan')}
                  className="w-full px-3 py-2 text-xs font-medium text-white transition-all bg-green-600 rounded-lg sm:w-auto sm:text-sm sm:px-4 hover:bg-green-700 touch-manipulation active:scale-95"
                >
                  {t('createJama')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
