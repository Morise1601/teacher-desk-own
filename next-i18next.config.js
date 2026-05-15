// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en', // Your default language
    locales: ['en', 'fr', 'zh', 'es', 'ar', 'hi'], // Languages you support (matching your image)
  },
  // Optional: Add a custom path for your translation files if needed
  // localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
};