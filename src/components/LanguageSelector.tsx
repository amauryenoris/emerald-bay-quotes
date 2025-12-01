import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../hooks/useLanguage';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-5 h-5 text-gray-600" />
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
            language === 'en'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => handleLanguageChange('es')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
            language === 'es'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ES
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;