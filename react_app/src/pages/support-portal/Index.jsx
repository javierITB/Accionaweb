import React from 'react';
import Header from '../../components/ui/Header.jsx';
import Sidebar from '../../components/ui/Sidebar.jsx';
import SupportHeader from './components/SupportHeader.jsx';
import QuickActions from './components/QuickActions.jsx';
import LiveChat from './components/LiveChat.jsx';
import KnowledgeBase from './components/KnowledgeBase.jsx';
import TicketSystem from './components/TicketSystem.jsx';
import VideoTutorials from './components/VideoTutorials.jsx';
import CommunityForum from './components/CommunityForum.jsx';
import ContactSupport from './components/ContactSupport.jsx';

const SupportPortal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="p-8 max-w-7xl mx-auto">
          <SupportHeader />
          <QuickActions />
          <KnowledgeBase />
          <TicketSystem />
          <VideoTutorials />
          <CommunityForum />
          <ContactSupport />
        </div>
      </main>

      <LiveChat />
    </div>
  );
};

export default SupportPortal;