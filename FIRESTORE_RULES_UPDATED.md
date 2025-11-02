# Updated Firestore Security Rules - Complete Fix

Copy and paste these rules into Firebase Console → Firestore Database → Rules

## Complete Rules with All Collections

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // PRODUCTS - Public read, authenticated write
    // ==========================================
    match /products/{productId} {
      // Anyone can read products (for landing page and marketplace)
      allow read: if true;
      
      // Only authenticated users can create
      allow create: if request.auth != null;
      
      // Farmers can update their own products
      // Buyers/System can update availableQuantity when placing orders
      allow update: if request.auth != null && (
        resource.data.farmerId == request.auth.uid ||
        // Allow updating availableQuantity for inventory management
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['availableQuantity', 'quantity']) &&
         request.auth != null)
      );
      
      // Only the farmer who created can delete
      allow delete: if request.auth != null && 
        resource.data.farmerId == request.auth.uid;
    }
    
    // ==========================================
    // USERS - Authentication required
    // ==========================================
    match /users/{userId} {
      // Authenticated users can read user data
      allow read: if request.auth != null;
      
      // Users can create their own user document
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own data, OR agents/admins can update for verification
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'])
      );
      
      // Users can delete their own data
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // ==========================================
    // ORDERS - Role-based access
    // ==========================================
    match /orders/{orderId} {
      // Users can read their own orders, agents and admins can read all
      allow read: if request.auth != null && (
        resource.data.buyerId == request.auth.uid || 
        resource.data.farmerId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'])
      );
      
      // Authenticated users can create orders
      allow create: if request.auth != null;
      
      // Farmers, buyers, agents, admins can update orders
      allow update: if request.auth != null && (
        resource.data.farmerId == request.auth.uid || 
        resource.data.buyerId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'])
      );
      
      // Only agents and admins can delete orders
      allow delete: if request.auth != null && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin']);
    }
    
    // ==========================================
    // TRANSPORTS - Transport tracking
    // ==========================================
    match /transports/{transportId} {
      // Users can read transports related to them (as farmer, buyer, or driver)
      allow read: if request.auth != null && (
        resource.data.farmerId == request.auth.uid ||
        resource.data.buyerId == request.auth.uid ||
        resource.data.assignedDriverId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'])
      );
      
      // Farmers and drivers can create/update transports
      allow create, update: if request.auth != null && (
        request.resource.data.farmerId == request.auth.uid ||
        request.resource.data.assignedDriverId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin'])
      );
      
      // Location history subcollection
      match /locationHistory/{locationId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    
    // ==========================================
    // EMERGENCY ALERTS - All authenticated users
    // ==========================================
    match /emergencyAlerts/{alertId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin']);
    }
    
    // ==========================================
    // COLD STORAGE RENTALS
    // ==========================================
    match /coldStorageRentals/{rentalId} {
      // Farmers can read their own rentals, admins can read all
      allow read: if request.auth != null && (
        resource.data.farmerId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
      
      // Farmers can create, update their own rentals
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.farmerId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }
    
    // ==========================================
    // NOTIFICATIONS - User-specific
    // ==========================================
    match /notifications/{notificationId} {
      // Users can read their own notifications or role-based notifications
      allow read: if request.auth != null && (
        resource.data.targetUserId == request.auth.uid ||
        resource.data.targetRole == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role ||
        resource.data.targetRole == 'all'
      );
      
      // System can create notifications
      allow create: if request.auth != null;
      
      // Users can update their own notifications (mark as read)
      allow update: if request.auth != null && 
        resource.data.targetUserId == request.auth.uid;
    }
    
    // ==========================================
    // CART - User-specific
    // ==========================================
    match /cart/{cartId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // ==========================================
    // WISHLIST - User-specific
    // ==========================================
    match /wishlist/{wishlistId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // ==========================================
    // MESSAGES - Authenticated users
    // ==========================================
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // ==========================================
    // ANNOUNCEMENTS - Read all, write agents/admins
    // ==========================================
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin']);
    }
    
    // ==========================================
    // COMMUNITY - Questions and Answers
    // ==========================================
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.authorId == request.auth.uid;
    }
    
    match /answers/{answerId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.authorId == request.auth.uid;
    }
    
    // ==========================================
    // RATINGS - Anyone authenticated can read, buyers can create
    // ==========================================
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.buyerId == request.auth.uid;
    }
  }
}
```

## Key Fixes for Your Error

1. **Products Collection**: Added permission for updating `availableQuantity` when orders are placed
2. **Transports Collection**: Added full read/write permissions for transport tracking
3. **Orders Collection**: Fixed to allow all authenticated users to create orders
4. **All New Collections**: Added rules for emergencyAlerts, coldStorageRentals, and notifications

## Steps to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/project/krishi-4bb11/firestore)
2. Click on "Firestore Database" → "Rules" tab
3. Delete existing rules
4. Paste the rules above
5. Click "Publish"
6. Wait a few seconds for rules to propagate
7. Refresh your app and try again

## Testing

After applying these rules, you should be able to:
- ✅ Place orders without permission errors
- ✅ Update product inventory automatically
- ✅ View transports in BuyerDashboard
- ✅ Create emergency alerts
- ✅ Manage cold storage rentals

