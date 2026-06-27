import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Bot, BarChart3, Users, Settings, Moon, Sun, Globe } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const navItems = [
    { to: '/app/agents', icon: Bot, label: 'Agents', labelHi: 'एजेंट्स' },
    { to: '/app/business', icon: BarChart3, label: 'Business', labelHi: 'व्यापार' },
    { to: '/app/community', icon: Users, label: 'Community', labelHi: 'समुदाय' },
    { to: '/app/dashboard', icon: Settings, label: 'Dashboard', labelHi: 'डैशबोर्ड' },
];

export default function AppLayout() {
    const { theme, toggleTheme, language, setLanguage } = useAppStore();
    const location = useLocation();

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Top Header - Desktop */}
            <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                        AutoBiz <span className="gradient-text">AI</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Globe className="w-4 h-4" />
                        {language === 'en' ? 'हिंदी' : 'English'}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Desktop Navigation */}
            <div className="flex-1 flex overflow-hidden">
                <nav className="hidden lg:flex flex-col w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-4 gap-2 items-center">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Main content */}
                <main className="flex-1 overflow-hidden">
                    <div key={location.pathname} className="h-full animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-2 safe-area-pb">
                {navItems.map(({ to, icon: Icon, label, labelHi }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-0.5 p-2 rounded-xl min-w-[60px] transition-all duration-200 ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">
                            {language === 'hi' ? labelHi : label}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
