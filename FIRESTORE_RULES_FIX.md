# Firestore Security Rules - Updated for Landing Page

## Quick Fix for Permission Errors

If you're seeing "Missing or insufficient permissions" errors on the Landing page, update your Firestore rules to allow **public read access** to products (only for viewing, not editing).

## Updated Firestore Rules

Go to Firebase Console → Firestore Database → Rules and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // PUBLIC READ ACCESS - For Landing Page
    // Allow anyone to read products (public listing)
    match /products/{productId} {
      // Anyone can read products (for landing page)
      allow read: if true;
      
      // Only authenticated users can create/update/delete
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.farmerId == request.auth.uid;
    }
    
    // Users can read/write their own data
    // Agents can update users for verification purposes
    match /users/{userId} {
      // Anyone authenticated can read users
      allow read: if request.auth != null;
      
      // Users can write their own data
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
    
    // Orders - users can read their own orders, create orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.farmerId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.farmerId == request.auth.uid || 
         resource.data.buyerId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent');
      allow delete: if request.auth != null && 
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
    
    // Notifications - users can read their own notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.targetUserId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.targetUserId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.targetUserId == request.auth.uid;
    }
    
    // Cart - users can read/write their own cart
    match /cart/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Wishlist - users can read/write their own wishlist
    match /wishlist/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Community - anyone authenticated can read/write
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
    
    // Ratings - anyone authenticated can read, buyers can create
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.buyerId == request.auth.uid;
    }
  }
}
```

## Key Changes

1. **Products collection**: Changed `allow read: if request.auth != null;` to `allow read: if true;`
   - This allows the landing page to display products without authentication
   - Still requires authentication for creating/updating/deleting

2. **Orders collection**: Added agent and admin roles for reading all orders

## Steps to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/project/krishi-4bb11/firestore)
2. Click on "Firestore Database" → "Rules" tab
3. Delete existing rules
4. Paste the rules above
5. Click "Publish"
6. Refresh your app

## Security Note

⚠️ Making products publicly readable is fine for a hackathon/demo. For production, you might want to:
- Only allow reading products marked as "published" or "active"
- Limit which fields are readable
- Add rate limiting

For now, this will fix the permission errors!

