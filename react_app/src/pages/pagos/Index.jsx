import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Dashboard from './components/Dashboard';

const PagosIndex = () => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const isMobileScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

    const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

    const toggleSidebar = () => {
        if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
        else setIsDesktopOpen(!isDesktopOpen);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar
                isCollapsed={!isDesktopOpen}
                onToggleCollapse={toggleSidebar}
                isMobileOpen={isMobileOpen}
                onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
            />

            {/* Mobile Overlay */}
            {isMobileScreen && isMobileOpen && (
                <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    </div>

                    {/* Dashboard Content */}
                    <Dashboard />
                </div>
            </main>
        </div>
    );
};

export default PagosIndex;
