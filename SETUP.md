# Setup Instructions for FarmLink

## 1. Install Dependencies

```bash
npm install
```

## 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable the following services:

### Authentication
- Go to Authentication → Sign-in method
- Enable Email/Password provider

### Firestore Database
- Go to Firestore Database
- Create database in production mode (for hackathon, test mode is fine)
- Set security rules (see below)

**Note**: We use Cloudinary for image storage (free tier) instead of Firebase Storage. See Cloudinary setup below.

## 3. Get Firebase Config

1. Go to Project Settings → General
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Copy the Firebase config object
5. Paste it into `src/config/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

## 4. Firestore Security Rules

Go to Firestore Database → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      // Agents can read all users for verification
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent';
    }
    
    // Products - anyone authenticated can read, only farmers can write
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.farmerId == request.auth.uid;
    }
    
    // Orders - users can read their own orders, create orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.farmerId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.farmerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent');
    }
    
    // Messages - anyone authenticated can read/write
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Announcements - anyone can read, only agents can write
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent';
    }
    
    // Questions and Answers - anyone authenticated can read/write
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /answers/{answerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Ratings - anyone authenticated can read, buyers can write
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Cart and Wishlist - users can manage their own
    match /cart/{cartId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /wishlist/{wishlistId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Votes - users can create their own votes
    match /votes/{voteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 5. Cloudinary Setup (Image Storage)

We use Cloudinary for image storage (free tier: 25 GB storage, 25 GB bandwidth/month).

1. Sign up for free at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → Settings
3. Copy your **Cloud name** (e.g., `dxyz123`)
4. Go to Settings → Upload → **Upload presets**
5. Click "Add upload preset"
6. Configure:
   - **Preset name**: `krishi_upload` (or any name you prefer)
   - **Signing mode**: **Unsigned** (for client-side uploads)
   - **Folder**: `krishi/verification` (optional, for organization)
   - Click "Save"
7. Update `src/config/cloudinary.js`:
   ```javascript
   export const cloudinaryConfig = {
     cloudName: 'your-cloud-name', // Paste your cloud name here
     uploadPreset: 'krishi_upload', // Paste your upload preset name here
     apiUrl: 'https://api.cloudinary.com/v1_1'
   }
   ```

**Why Cloudinary?**
- Free tier: 25 GB storage, 25 GB bandwidth/month
- No credit card required
- Fast image uploads and delivery
- Automatic image optimization

## 6. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 7. Demo Accounts (Create these in Firebase Auth)

### Farmer
- Email: `farmer@demo.com`
- Password: `password123`
- Role: `farmer`

After creating:
1. Set `role: 'farmer'` in Firestore `users` collection
2. Set `registrationPaid: false` to test payment flow
3. After payment, set `status: 'pending_verification'` for agent approval

### Buyer
- Email: `buyer@demo.com`
- Password: `password123`
- Role: `buyer`

After creating:
1. Set `role: 'buyer'` in Firestore `users` collection
2. Set `verified: false` to test verification flow

### Agent
- Email: `agent@demo.com`
- Password: `password123`
- Role: `agent`

After creating:
1. Set `role: 'agent'` in Firestore `users` collection

## 8. Firestore Collections Structure

The app uses these collections:

- **users**: User accounts (farmers, buyers, agents)
- **products**: Product listings
- **orders**: Purchase orders
- **cart**: Shopping cart items
- **wishlist**: Wishlist items
- **ratings**: Farmer ratings and reviews
- **questions**: Community Q&A questions
- **answers**: Answers to questions
- **messages**: Product-specific messages
- **announcements**: Agent announcements
- **votes**: Votes on questions/answers

## 9. Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy to Vercel/Netlify.

## 10. Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. New site from Git → Connect to GitHub
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy!

## Troubleshooting

- **Firebase config error**: Make sure you've replaced the placeholder config in `src/config/firebase.js`
- **Permission denied**: Check Firestore security rules
- **Auth errors**: Ensure Email/Password is enabled in Firebase Authentication
- **Image upload fails**: Check Cloudinary config in `src/config/cloudinary.js` - ensure cloudName and uploadPreset are set correctly
- **Port 3000 in use**: Change port in `vite.config.js`

## Key Features Implemented

✅ Farmer verification with crop images
✅ Buyer verification with trade license
✅ Agent verification dashboard
✅ One-time farmer registration payment (dummy bKash integration)
✅ Rating and review system
✅ Cart and wishlist functionality
✅ Buyer ledger system
✅ Centralized community Q&A
✅ Landing page with analytics
✅ Product showcase with crop quality images
✅ Cold storage booking
✅ Price freshness algorithm

## Support

For issues or questions, check the community Q&A section in the app or contact support.

