# Complete Firestore Security Rules - Fixed All Permissions

Copy and paste these rules into Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // PRODUCTS - Public read for landing page
    // ==========================================
    match /products/{productId} {
      // Anyone can read products (for landing page and marketplace)
      allow read: if true;
      
      // Only authenticated users can create
      allow create: if request.auth != null;
      
      // Only the farmer who created can update/delete
      allow update, delete: if request.auth != null && 
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
      
      // Users can update their own data, OR agents can update for verification
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent')
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
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
      
      // Authenticated users can create orders
      allow create: if request.auth != null;
      
      // Farmers, buyers, agents can update orders
      allow update: if request.auth != null && (
        resource.data.farmerId == request.auth.uid || 
        resource.data.buyerId == request.auth.uid ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent')
      );
      
      // Only agents can delete orders (for cancellation)
      allow delete: if request.auth != null && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent');
    }
    
    // ==========================================
    // MESSAGES - Authenticated users
    // ==========================================
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // ==========================================
    // ANNOUNCEMENTS - Read all, write agents only
    // ==========================================
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent');
    }
    
    // ==========================================
    // NOTIFICATIONS - User-specific access
    // ==========================================
    match /notifications/{notificationId} {
      // Users can read their own notifications OR role-based notifications
      allow read: if request.auth != null && (
        resource.data.targetUserId == request.auth.uid ||
        (resource.data.targetRole != null && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         (resource.data.targetRole == 'all' ||
          resource.data.targetRole == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role))
      );
      
      // Authenticated users can create notifications (for system notifications)
      allow create: if request.auth != null;
      
      // Users can update their own notifications (mark as read)
      allow update: if request.auth != null && (
        resource.data.targetUserId == request.auth.uid ||
        (resource.data.targetRole != null && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         (resource.data.targetRole == 'all' ||
          resource.data.targetRole == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role))
      );
      
      // Users can delete their own notifications
      allow delete: if request.auth != null && 
        resource.data.targetUserId == request.auth.uid;
    }
    
    // ==========================================
    // CART - User-specific access
    // ==========================================
    match /cart/{cartId} {
      // Users can read/write their own cart items
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Allow creating cart items with userId matching auth uid
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // ==========================================
    // WISHLIST - User-specific access
    // ==========================================
    match /wishlist/{wishlistId} {
      // Users can read/write their own wishlist items
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Allow creating wishlist items with userId matching auth uid
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // ==========================================
    // COMMUNITY - Authenticated users
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
    
    match /votes/{voteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // ==========================================
    // RATINGS - Authenticated users
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

## Key Fixes

1. **Products**: `allow read: if true` - Public read access for landing page
2. **Cart**: Fixed to check `resource.data.userId == request.auth.uid` for existing docs and `request.resource.data.userId` for creates
3. **Notifications**: Fixed to allow reading by `targetUserId` OR `targetRole` matching user's role
4. **Wishlist**: Same fix as cart
5. **Orders**: Added admin role for reading all orders

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/project/krishi-4bb11/firestore/rules)
2. Delete existing rules
3. Paste the rules above
4. Click **"Publish"**
5. Wait 10-20 seconds for rules to propagate
6. Refresh your app

## Testing

After applying rules, test:
- ✅ Landing page loads products without login
- ✅ Cart loads for authenticated users
- ✅ Notifications load for authenticated users
- ✅ Can add to cart/wishlist
- ✅ Can create notifications
- ✅ All CRUD operations work for correct roles

