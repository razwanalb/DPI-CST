import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../supabase';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Academic', path: '/academic' },
  { name: 'Teachers', path: '/teachers' },
  { name: 'Event', path: '/events' },
  { name: 'Notice', path: '/notice' },
  { name: 'Results', path: '/results' },
  { name: 'Contact Us', path: '/contact' },
];

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState({
    departmentName: 'Computer Department',
    instituteName: 'Dinajpur Polytechnic Institute',
    logoUrl: 'https://i.imgur.com/pWs3vnL.jpg'
  });

  useEffect(() => {
      const fetchSiteInfo = async () => {
          const { data, error } = await supabase
              .from('site_settings')
              .select('key, value')
              .in('key', ['department_name', 'institute_name', 'site_logo_url']);
          
          if (error) {
              console.error("Could not fetch site info for header:", error.message || error);
          } else {
              const info = data.reduce((acc, { key, value }) => {
                  if (key === 'department_name') acc.departmentName = value;
                  if (key === 'institute_name') acc.instituteName = value;
                  if (key === 'site_logo_url') acc.logoUrl = value?.trim();
                  return acc;
              }, { departmentName: '', instituteName: '', logoUrl: '' });

              setSiteInfo(prev => ({
                  departmentName: info.departmentName || prev.departmentName,
                  instituteName: info.instituteName || prev.instituteName,
                  logoUrl: info.logoUrl || prev.logoUrl,
              }));
          }
      };
      fetchSiteInfo();
  }, []);

  const baseLinkClasses = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200";
  const inactiveLinkClasses = "text-text/80 hover:text-text hover:bg-surface";
  const activeLinkClasses = "text-text font-semibold bg-surface";
  
  return (
    <header className="bg-surface/30 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <img 
              alt="DPI Logo" 
              className="h-10 w-10 object-contain flex-shrink-0" 
              src={siteInfo.logoUrl}
            />
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-text truncate">{siteInfo.departmentName}</h1>
              <p className="text-sm font-medium text-text/70 truncate">{siteInfo.instituteName}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
             <NavLink
              to="/login"
              aria-label="Admin Login"
              className="hidden md:inline-flex items-center justify-center h-10 w-10 bg-gradient-to-r from-primary to-secondary text-white rounded-lg transition-transform hover:scale-105 shadow-md"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </NavLink>
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className="material-symbols-outlined text-text">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#001833]/95 backdrop-blur-lg border-t border-border">
          <nav className="flex flex-col items-center gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `block w-full text-center ${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
              >
                {link.name}
              </NavLink>
            ))}
             <NavLink
              to="/login"
              aria-label="Admin Login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center h-10 w-10 bg-gradient-to-r from-primary to-secondary text-white rounded-lg transition-transform hover:scale-105 shadow-md"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;