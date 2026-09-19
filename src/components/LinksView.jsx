import React from 'react';
import { MessageCircle, Globe } from 'lucide-react';

export default function LinksView() {
  const links = [
    {
      title: 'WhatsApp',
      url: 'https://wa.me/51916098803',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600 text-white',
    },
    {
      title: 'Facebook',
      url: 'https://www.facebook.com/momentos265',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      title: 'TikTok',
      url: 'https://www.tiktok.com/@momentos_365',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 006.35 6.33 6.32 6.32 0 006.3-5.22v-6.9a8.1 8.1 0 005 1.71V8.16a4.8 4.8 0 01-3.06-1.47z"/>
        </svg>
      ),
      color: 'bg-black hover:bg-gray-800 text-white',
    },
    {
      title: 'Página Web',
      url: 'https://momentos365.com',
      icon: <Globe className="w-6 h-6" />,
      color: 'bg-rose-500 hover:bg-rose-600 text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 mt-10">
        <div className="flex flex-col items-center">
          <img
            src="/images/logo.png"
            alt="Momentos 365"
            className="w-32 h-32 object-contain rounded-full shadow-lg bg-white p-3 mb-6 border-2 border-rose-200"
          />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Momentos 365</h1>
          <p className="mt-3 text-base text-gray-600 text-center font-medium max-w-xs">
            Regalos y detalles inolvidables para toda ocasión 🎁✨
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center w-full px-6 py-4 rounded-xl shadow-md transition-all transform hover:-translate-y-1 hover:shadow-xl duration-300 ${link.color}`}
            >
              <div className="flex items-center space-x-3">
                {link.icon}
                <span className="text-lg font-bold tracking-wide">{link.title}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
