# deshBazar - Farm to Buyer Marketplace 🌾

A complete, production-ready marketplace platform connecting farmers with buyers, featuring admin oversight, real-time notifications, payment integration, and community support.

## 🎯 Platform Highlights

- **15+ Major Features** - Complete marketplace ecosystem
- **4 User Roles** - Admin, Agent, Farmer, Buyer
- **Real-time Notifications** - Order updates, announcements
- **Payment Integration** - bKash/Nagad/Rocket (demo)
- **Dark Mode** - Full dark theme support
- **Bilingual** - Bangla ⇄ English toggle
- **Analytics Dashboard** - Charts and platform insights
- **Community Q&A** - Built-in support forum

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Run
npm run dev
```

Visit: `http://localhost:3000`

## 📚 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Start here! Complete guide
- **[SETUP.md](./SETUP.md)** - Firebase & Cloudinary setup
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - All features overview
- **[QUICK_FIXES.md](./QUICK_FIXES.md)** - Common errors & solutions

## 🎨 Design System

**Color Palette:**
- **Primary**: Fresh Green (#2E7D32) - Buttons, CTAs
- **Secondary**: Warm Sand (#F5E6C5) - Backgrounds
- **Accent**: Sky Blue (#4FC3F7) - Links, icons
- **Text**: Dark Brown (#3E2723) - Headings, text

**Features:**
- Dark mode toggle (navbar)
- Language toggle: Bangla ⇄ English
- Responsive design
- Modern, clean UI

## 🔑 Demo Flow

1. **Admin** → View analytics → Approve agent
2. **Farmer** → Pay registration → Upload docs → List products
3. **Buyer** → Verify → Browse → Add to cart → Checkout
4. **Orders** → Real-time notifications → Track status
5. **Rating** → Review farmers after delivery
6. **Community** → Ask questions → Get answers

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS (Custom deshBazar theme)
- Firebase (Auth + Firestore)
- Cloudinary (Image storage)
- Context API (Language & Dark mode)

## ⚙️ Key Features

### Admin
- Analytics dashboard with charts
- Approve/reject agents
- Platform oversight

### Agent
- Verify farmers & buyers
- Cancel orders
- Send announcements
- Export ledgers

### Farmer
- Registration payment (৳500)
- Upload verification docs
- List products with quality images
- Manage orders
- Receive notifications

### Buyer
- Trade license verification
- Cart & wishlist
- Checkout with payment
- Track orders
- Rate farmers
- Export ledger

### Community
- Q&A forum
- Voting system
- Best answer selection
- Category filters

### Notifications
- Real-time updates
- Notification bell
- Order alerts
- Announcements

## 📦 Build & Deploy

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

## 🎬 Hackathon Demo (5-7 min)

1. Show landing page + toggle dark mode + language
2. Admin dashboard analytics
3. Complete farmer registration flow
4. Buyer places order → Notifications
5. Agent cancels order → Both notified
6. Community Q&A
7. Export ledger CSV

## 🔧 Setup Requirements

1. Update Firestore rules (see SETUP.md)
2. Create Firebase indexes (click error links)
3. Configure Cloudinary (already done)
4. Create demo accounts

## ✨ What Makes This Special

- **Complete Ecosystem**: Not just a marketplace, but a full platform
- **Real Workflows**: Actual verification and payment flows
- **Modern UX**: Dark mode, bilingual, responsive
- **Professional**: Admin tools, analytics, notifications
- **Hackathon-Ready**: Fully functional demo

## 📊 Platform Statistics

The system tracks:
- Total users by role
- Products listed
- Orders placed & completed
- Pending verifications
- Platform growth

## 🌐 Language Support

- **English**: Default
- **Bangla**: Full translation support
- Toggle button in navbar
- Persistent preference

## 🌙 Dark Mode

- Toggle in navbar
- Applies to all pages
- Saves preference
- Professional dark theme

---

**Ready for hackathon! All features implemented! 🚀**

Currency: BDT (৳) | Languages: English & Bangla | Theme: Light & Dark

