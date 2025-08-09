const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function to handle new user registration.
 *
 * @param {object} data The data passed from the client, containing user details.
 * @param {object} context The context of the call, for checking authentication.
 */
exports.createUserAccount = functions.https.onCall(async (data, context) => {
  // --- Basic Validation ---
  if (!data.email || !data.password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and password are required."
    );
  }

  // --- Create User in Firebase Authentication ---
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
    });
  } catch (error) {
    console.error("Error creating new user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create authentication user."
    );
  }

  const { uid } = userRecord;

  // --- Create User Document in Firestore ---
  const newUserDocument = {
    uid: uid,
    email: data.email,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    phone: data.phone || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    zip: data.zip || "",
    nspId: data.isOtherAffiliated ? data.nspId : "",
    isAffiliated: data.isCmspAffiliated,
    primaryAgency: data.isOtherAffiliated
      ? data.primaryAgency
      : data.isCmspAffiliated
      ? "Crystal Mountain Ski Patrol"
      : "",
    role: "Student",
    isAdmin: false,
    allowScheduling: false,
    assignments: {},
    enrolledClasses: [],
    completedClasses: {},
    isApproved: false,
    needsApproval: true,
  };

  try {
    await admin.firestore().collection("users").doc(uid).set(newUserDocument);
    console.log(`Successfully created user document for UID: ${uid}`);
    return { status: "success", message: "User created successfully." };
  } catch (error) {
    console.error(`Error creating Firestore document for UID: ${uid}`, error);
    // If Firestore write fails, we should ideally delete the Auth user to clean up.
    await admin.auth().deleteUser(uid);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to save user profile."
    );
  }
});