# FarmLink - Complete Marketplace Platform 🚜

A comprehensive, hackathon-ready platform connecting farmers with buyers, featuring automatic price freshness, verification workflows, admin oversight, real-time notifications, and community Q&A.

## 🎯 Complete Feature List

### Core Features
- **Price Freshness**: Automatic 10% daily discount (capped at 40%) for older listings
- **Multi-Role System**: Farmer, Buyer, Agent, Admin with complete workflows
- **Verification System**: Digital verification for farmers (ID + crop photos) and buyers (trade license)
- **Payment Integration**: Dummy bKash/Nagad/Rocket for farmer registration and checkout
- **Cart & Wishlist**: Full shopping cart and wishlist functionality
- **Order Tracking**: Complete order lifecycle (pending → delivered)
- **Cold Storage**: Subscription plans with per-order booking
- **Real-time Notifications**: Order updates, announcements, and alerts
- **Community Q&A**: Centralized forum with voting and best answers
- **Rating System**: Buyer reviews for farmers
- **Admin Dashboard**: Analytics, charts, and platform oversight
- **Agent Tools**: Verification dashboard, order management, announcements

### Payment Features
- ✅ One-time farmer registration fee (৳500)
- ✅ Product checkout with bKash/Nagad/Rocket
- ✅ Escrow system (payment held until delivery)
- ✅ Transaction tracking and ledger

### Notification System
- ✅ Notification bell in navbar (shows unread count)
- ✅ Order placement notifications (farmer)
- ✅ Order status updates (buyer)
- ✅ Order cancellation alerts (both parties)
- ✅ Agent announcements (targeted by role)
- ✅ Real-time updates

### Admin Features
- ✅ Approve/reject agents
- ✅ Platform analytics dashboard
- ✅ User distribution charts
- ✅ Order statistics
- ✅ Growth metrics

### Agent Features
- ✅ Approve/reject farmers and buyers
- ✅ View verification documents
- ✅ Cancel orders with reason
- ✅ Send targeted announcements
- ✅ Export ledger CSV

## ⚡ Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Firebase & Cloudinary:**
   - See [SETUP.md](./SETUP.md) for detailed configuration
   - Update `src/config/firebase.js` with your Firebase config
   - Update `src/config/cloudinary.js` with your Cloudinary credentials

3. **Update Firestore Security Rules:**
   - Copy rules from `SETUP.md`
   - Paste in Firebase Console → Firestore → Rules
   - Click Publish

4. **Create Firestore Indexes:**
   - See [FIRESTORE_INDEXES_FIX.md](./FIRESTORE_INDEXES_FIX.md)
   - Or click links in error messages to auto-create

5. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - All features and file structure
- **[QUICK_FIXES.md](./QUICK_FIXES.md)** - Common errors and solutions
- **[FIRESTORE_INDEXES_FIX.md](./FIRESTORE_INDEXES_FIX.md)** - Index creation guide
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** - Hackathon demo script
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (FarmLink theme: dark blue + orange)
- **Backend**: Firebase (Auth + Firestore)
- **Image Storage**: Cloudinary (free tier: 25 GB)
- **Routing**: React Router v6
- **Notifications**: Real-time Firestore queries
- **PWA**: Ready (manifest included)

## 🔑 Demo Accounts

Create these in Firebase Auth + Firestore:

### Admin
- **Email**: `admin@demo.com`
- **Password**: `password123`
- **Firestore**: `{ role: 'admin', verified: true }`

### Agent
- **Email**: `agent@demo.com`
- **Password**: `password123`
- **Firestore**: `{ role: 'agent', verified: true }`

### Farmer
- **Email**: `farmer@demo.com`
- **Password**: `password123`
- Follow complete flow: Payment → Upload docs → Agent approval

### Buyer
- **Email**: `buyer@demo.com`
- **Password**: `password123`
- Follow complete flow: Upload trade license → Agent approval

## 🎬 Complete Demo Flow (5-7 minutes)

### 1. Admin Flow (1 min)
1. Sign in as admin
2. View analytics dashboard (users, orders, stats)
3. Approve a pending agent

### 2. Agent Flow (1.5 min)
1. Sign in as agent
2. Go to verification dashboard
3. Approve a farmer (view ID card, crop photos)
4. Approve a buyer (view trade license)
5. Send announcement to all farmers

### 3. Farmer Flow (2 min)
1. Sign up as new farmer
2. Pay ৳500 registration fee (dummy bKash)
3. Upload ID card + crop photos + location
4. Wait for agent approval (switch to agent, approve)
5. List product with crop quality images
6. Show fresh vs old product pricing

### 4. Buyer Flow (2 min)
1. Sign up as new buyer
2. Upload trade license and business details
3. Wait for agent approval
4. Browse marketplace
5. Add products to cart
6. Checkout with dummy payment
7. View order in ledger

### 5. Order Management (1 min)
1. Farmer receives notification of new order
2. Farmer: Accept → Pack → Ship → Deliver
3. Buyer receives status update notifications
4. Buyer rates farmer (5 stars + review)

### 6. Community & Notifications (30 sec)
1. Ask question in community
2. Another user answers
3. Upvote answer
4. Check notification bell for updates

## 📦 Build for Production

```bash
npm run build
```

Output: `dist/` folder ready for deployment

## 🚀 Deployment

**Vercel** (Recommended):
```bash
vercel --prod
```

**Netlify**:
```bash
netlify deploy --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

## ⚠️ Important Notes

1. **Firestore Indexes**: Create all required indexes (see FIRESTORE_INDEXES_FIX.md)
2. **Security Rules**: Use updated rules from SETUP.md (allows agent verification)
3. **Admin Account**: Must be created manually in Firebase (not via signup for security)
4. **ERR_BLOCKED_BY_CLIENT**: Disable ad blocker for localhost
5. **Cloudinary**: Free tier has 25 GB storage limit

## 🏆 Hackathon Highlights

- Complete end-to-end workflows for all roles
- Real-time notifications and updates
- Professional admin dashboard with analytics
- Modern, unified UI (dark blue + orange theme)
- Mobile-first responsive design
- Payment integration ready
- Community-driven support

## 📊 Platform Statistics

The admin dashboard shows:
- Total users (farmers, buyers, agents)
- Total products listed
- Orders placed and completed
- Pending verifications
- User distribution charts
- Order completion rate

## 🔔 Notification Types

1. **Farmer Notifications**:
   - New order received
   - Order cancelled

2. **Buyer Notifications**:
   - Order accepted
   - Order packed
   - Order shipped
   - Order delivered
   - Order cancelled

3. **All Users**:
   - Agent announcements (targeted by role)

## 💡 Tips for Hackathon Presentation

1. Start with admin dashboard (show analytics)
2. Demo complete farmer registration flow
3. Show buyer verification
4. Place order and show real-time notifications
5. Agent cancels order → both parties notified
6. Show community Q&A
7. Export ledger CSV

---

**All features implemented and ready for demo! 🎉**

Built with React, Firebase, Cloudinary, and Tailwind CSS. Currency: BDT (৳)

