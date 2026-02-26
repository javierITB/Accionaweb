import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import Dashboard from './components/Dashboard';

const PagosIndex = () => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setIsMobileScreen(isMobile);
            if (isMobile) setIsMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" onClick={toggleSidebar}></div>
            )}

            {/* BOTÓN MÓVIL ESTÁTICO (FLOATING) */}
            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={toggleSidebar}
                        iconName="Menu"
                        className="w-12 h-12 rounded-full shadow-brand-active active:scale-95 transition-transform"
                    />
                </div>
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
