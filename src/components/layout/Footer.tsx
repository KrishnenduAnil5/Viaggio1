import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#EAE5DF] bg-[#F7F1E9] py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#77716B]">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-sm text-[#111111]">Viaggio</span>
          <span>—</span>
          <span>Your journey, beautifully organized.</span>
        </div>
        
        <div className="flex items-center gap-6">
          <span>Row Level Security Enforced</span>
          <span>·</span>
          <span>Supabase Auth & Storage</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} Viaggio Travel-Tech</span>
        </div>
      </div>
    </footer>
  );
};
