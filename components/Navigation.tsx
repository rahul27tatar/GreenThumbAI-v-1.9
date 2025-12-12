import React from 'react';
import { AppMode } from '../types';
import { Leaf, Stethoscope, MessageCircle, Sprout, LayoutDashboard } from 'lucide-react';

interface NavigationProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: AppMode.HOME, label: 'Home', icon: LayoutDashboard },
    { mode: AppMode.IDENTIFY, label: 'Identify', icon: Leaf },
    { mode: AppMode.DIAGNOSE, label: 'Diagnose', icon: Stethoscope },
    { mode: AppMode.CHAT, label: 'Ask Expert', icon: MessageCircle },
    { mode: AppMode.GARDEN, label: 'My Garden', icon: Sprout },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-lg z-50 md:sticky md:top-0 md:h-screen md:w-20 md:flex-col md:justify-center md:border-t-0 md:border-r md:bg-white">
      <div className="flex justify-around items-center h-16 md:flex-col md:h-auto md:gap-8 md:py-8">
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`flex flex-col items-center justify-center w-full md:w-auto p-2 transition-all duration-200 group ${
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-100' : 'group-hover:bg-emerald-50'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
              </div>
              <span className="text-[10px] mt-1 font-medium hidden md:block">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
