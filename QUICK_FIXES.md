# Quick Fixes for Common Errors

## 1. "Navbar is not defined" Error
**Fixed!** Added missing Navbar import to ProductDetail.jsx

## 2. Firestore Index Required Error

When you see this error:
```
The query requires an index. You can create it here: https://console.firebase...
```

**Solution:**
1. Click the link in the error message
2. It will open Firebase Console with the index pre-configured
3. Click "Create Index"
4. Wait 1-2 minutes
5. Refresh your app

**Manual creation:**
Go to Firebase Console → Firestore → Indexes tab and create these:

### Messages Index (Required)
- Collection: `messages`
- Fields:
  - `productId` (Ascending)
  - `createdAt` (Ascending)

### Notifications Index (Required)
- Collection: `notifications`
- Fields:
  - `targetUserId` (Ascending)
  - `createdAt` (Descending)

- Collection: `notifications`
- Fields:
  - `targetRole` (Ascending)
  - `createdAt` (Descending)

### Orders Index (Required)
- Collection: `orders`
- Fields:
  - `buyerId` (Ascending)
  - `createdAt` (Descending)

- Collection: `orders`
- Fields:
  - `farmerId` (Ascending)
  - `createdAt` (Descending)

### Answers Index (Required)
- Collection: `answers`
- Fields:
  - `questionId` (Ascending)
  - `votes` (Descending)
  - `createdAt` (Ascending)

## 3. Agent Permission Denied Error

**Fixed!** Updated Firestore security rules to allow agents to update user documents.

**To apply:**
1. Go to Firebase Console → Firestore → Rules
2. Replace the `users` section with the rules from `SETUP.md`
3. Click Publish

## 4. ERR_BLOCKED_BY_CLIENT

This is caused by browser extensions (ad blockers).

**Solutions:**
1. Disable ad blocker for localhost
2. Disable browser extensions temporarily
3. Use incognito/private mode
4. Add localhost to whitelist in ad blocker settings

This error doesn't affect functionality, just console noise.

## 5. Missing Product Images

If products don't show crop images:

1. Make sure Cloudinary is configured in `src/config/cloudinary.js`
2. Check upload preset is set to "Unsigned"
3. Test by uploading a product as a farmer

## 6. Demo Accounts Not Working

Create demo accounts in Firebase:

1. Go to Firebase Console → Authentication → Users
2. Add user manually:
   - Email: `admin@demo.com`
   - Password: `password123`
3. Then go to Firestore → `users` collection
4. Add document with ID = user's UID from Authentication
5. Set fields:
   ```json
   {
     "email": "admin@demo.com",
     "name": "Admin User",
     "role": "admin",
     "verified": true,
     "createdAt": "2024-11-01T00:00:00.000Z"
   }
   ```

Repeat for agent, farmer, and buyer accounts.

## 7. Orders Not Showing

If orders don't appear, check:

1. Firestore rules allow reading orders
2. User has permission (buyer or farmer on that order)
3. Orders collection exists and has data
4. Index is created for orders collection

## All Critical Fixes Applied

✅ Navbar import added
✅ Firestore security rules updated
✅ Index creation instructions provided
✅ Theme colors unified
✅ All features implemented

Ready for demo!

