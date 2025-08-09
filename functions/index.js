const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function that triggers when a new user is created.
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  // You can pull in more data if provided during sign-up,
  // but for this flow, we'll rely on the user to fill it out post-approval.
  // The client will no longer pass this data.
  const newUserDocument = {
    uid: uid,
    email: email,
    firstName: "New", // Placeholder
    lastName: "User", // Placeholder
    nspId: "",
    role: "Student",
    isAdmin: false,
    isAffiliated: false,
    primaryAgency: "",
    allowScheduling: false,
    assignments: {},
    enrolledClasses: [],
    completedClasses: {},
    isApproved: false, // Account is NOT approved by default.
    needsApproval: true, // This flag shows it's in the queue.
  };

  // Create the new user document in Firestore with the user's UID as the doc ID.
  try {
    await admin.firestore().collection("users").doc(uid).set(newUserDocument);
    console.log(`Successfully created user document for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error(`Error creating user document for UID: ${uid}`, error);
    return null;
  }
});