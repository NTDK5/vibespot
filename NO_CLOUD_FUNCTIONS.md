# Using VibeSpot Without Cloud Functions

Your app is configured to work without Cloud Functions. Here's what you need to know:

## ✅ What Works

- ✅ User authentication (email/password)
- ✅ Places management (add, view, edit, delete)
- ✅ Reviews system (add, edit, delete reviews)
- ✅ Rating calculation (automatic via client-side function)
- ✅ Image uploads
- ✅ Map view
- ✅ Search and filtering
- ✅ Security rules (Firestore & Storage)

## ⚠️ Manual Steps Required

### 1. Set Admin Role Manually

Since Cloud Functions aren't available, you need to manually set admin roles:

1. **Register a user** through the app
2. Go to [Firebase Console](https://console.firebase.google.com/project/vibespot-28e94/firestore)
3. Navigate to **Firestore Database** > `users` collection
4. Find the user document (by email or UID)
5. Click **Edit** and change the `role` field from `"user"` to `"admin"`
6. Save the changes

**Note:** After setting admin role, the user may need to sign out and sign back in for the changes to take effect.

### 2. Rating Calculation

Rating calculation now happens automatically on the client side when:
- A review is added
- A review is updated
- A review is deleted

This means ratings will update immediately without needing Cloud Functions.

## 🚀 Getting Started

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Register your first user:**
   - Open the app
   - Go to Register screen
   - Create an account with email/password

3. **Set yourself as admin:**
   - Follow the steps above to set your role to "admin"
   - Sign out and sign back in

4. **Start using the app:**
   - As admin, you'll see the "Add Place" option
   - Add your first place
   - Normal users can browse and leave reviews

## 📝 Notes

- **Google Sign-In:** Currently not implemented. Use email/password for now.
- **Custom Claims:** Not set automatically. Roles are managed via Firestore only.
- **Rating Updates:** Happen automatically via client-side calculation.

## 🔄 Upgrading to Cloud Functions Later

If you decide to upgrade to the Blaze plan later:

1. Upgrade at: https://console.firebase.google.com/project/vibespot-28e94/usage/details
2. Deploy Cloud Functions:
   ```bash
   firebase deploy --only functions
   ```
3. Update Cloud Function URLs in:
   - `src/services/auth.js`
   - `src/services/reviews.js`
4. The app will automatically use Cloud Functions for better performance

## 🆘 Troubleshooting

**"Permission denied" errors:**
- Make sure you've set the user role to "admin" in Firestore
- Check that security rules are deployed: `firebase deploy --only firestore:rules,storage`

**Ratings not updating:**
- Check browser console for errors
- Verify reviews are being saved to Firestore
- The rating calculation happens automatically, but you can manually trigger it if needed

**Can't see "Add Place" option:**
- Verify your user role is set to "admin" in Firestore
- Sign out and sign back in
- Check that `useAuth` hook is detecting the admin role

## 📚 Additional Resources

- [Firebase Console](https://console.firebase.google.com/project/vibespot-28e94)
- [Firestore Database](https://console.firebase.google.com/project/vibespot-28e94/firestore)
- [Project README](./README.md)
- [Setup Guide](./SETUP.md)

