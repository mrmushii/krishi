import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 rounded-lg text-sm font-medium bg-deshbazar-secondary text-deshbazar-text hover:bg-yellow-100 dark:bg-dark-card dark:text-dark-text dark:hover:bg-gray-700 transition-colors"
      title={language === 'en' ? 'Switch to Bangla' : 'ইংরেজিতে স্যুইচ করুন'}
    >
      {language === 'en' ? 'বাংলা' : 'English'}
    </button>
  )
}

