import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    
    // Navigation
    marketplace: 'Marketplace',
    community: 'Community',
    orders: 'Orders',
    cart: 'Cart',
    wishlist: 'Wishlist',
    ledger: 'Ledger',
    dashboard: 'Dashboard',
    
    // Roles
    farmer: 'Farmer',
    buyer: 'Buyer',
    agent: 'Agent',
    admin: 'Admin',
    
    // Products
    addProduct: 'Add Product',
    productName: 'Product Name',
    quantity: 'Quantity',
    price: 'Price',
    marketPrice: 'Market Price',
    fresh: 'Fresh',
    discount: 'Discount',
    
    // Orders
    placeOrder: 'Place Order',
    orderPlaced: 'Order Placed',
    pending: 'Pending',
    accepted: 'Accepted',
    packed: 'Packed',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    
    // Verification
    verification: 'Verification',
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    approve: 'Approve',
    reject: 'Reject',
    
    // Notifications
    notifications: 'Notifications',
    newOrder: 'New Order',
    orderUpdate: 'Order Update',
    announcement: 'Announcement',
    
    // Community
    askQuestion: 'Ask Question',
    postAnswer: 'Post Answer',
    question: 'Question',
    answer: 'Answer',
    
    // Common phrases
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?'
  },
  
  bn: {
    // Common
    welcome: 'স্বাগতম',
    loading: 'লোড হচ্ছে...',
    signIn: 'সাইন ইন',
    signUp: 'সাইন আপ',
    signOut: 'সাইন আউট',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    name: 'নাম',
    submit: 'জমা দিন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    view: 'দেখুন',
    search: 'অনুসন্ধান',
    filter: 'ফিল্টার',
    
    // Navigation
    marketplace: 'বাজার',
    community: 'কমিউনিটি',
    orders: 'অর্ডার',
    cart: 'কার্ট',
    wishlist: 'পছন্দের তালিকা',
    ledger: 'খাতা',
    dashboard: 'ড্যাশবোর্ড',
    
    // Roles
    farmer: 'কৃষক',
    buyer: 'ক্রেতা',
    agent: 'এজেন্ট',
    admin: 'অ্যাডমিন',
    
    // Products
    addProduct: 'পণ্য যোগ করুন',
    productName: 'পণ্যের নাম',
    quantity: 'পরিমাণ',
    price: 'মূল্য',
    marketPrice: 'বাজার মূল্য',
    fresh: 'তাজা',
    discount: 'ছাড়',
    
    // Orders
    placeOrder: 'অর্ডার করুন',
    orderPlaced: 'অর্ডার সম্পন্ন',
    pending: 'মুলতুবি',
    accepted: 'গৃহীত',
    packed: 'প্যাক করা',
    inTransit: 'পথে',
    delivered: 'ডেলিভারি সম্পন্ন',
    cancelled: 'বাতিল',
    
    // Verification
    verification: 'যাচাইকরণ',
    verified: 'যাচাইকৃত',
    pendingVerification: 'যাচাইয়ের অপেক্ষায়',
    approve: 'অনুমোদন',
    reject: 'প্রত্যাখ্যান',
    
    // Notifications
    notifications: 'বিজ্ঞপ্তি',
    newOrder: 'নতুন অর্ডার',
    orderUpdate: 'অর্ডার আপডেট',
    announcement: 'ঘোষণা',
    
    // Community
    askQuestion: 'প্রশ্ন করুন',
    postAnswer: 'উত্তর দিন',
    question: 'প্রশ্ন',
    answer: 'উত্তর',
    
    // Common phrases
    dontHaveAccount: 'অ্যাকাউন্ট নেই?',
    alreadyHaveAccount: 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?'
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

