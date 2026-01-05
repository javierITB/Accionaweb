import React from 'react';
import Header from '../../components/ui/Header.jsx';
import TicketSystem from './components/TicketSystem.jsx';
import ContactSupport from './components/ContactSupport.jsx';

const SupportPortal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="p-8 max-w-7xl mx-auto">
          <TicketSystem />
          <ContactSupport />
        </div>
      </main>

    </div>
  );
};

export default SupportPortal;