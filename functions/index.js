const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { RRule } = require('rrule');

// Initialize the Firebase Admin SDK
initializeApp();

/**
 * Creates a new user account in Firebase Authentication and a corresponding
 * user document in Firestore.
 */
exports.createUserAccount = onCall(async (request) => {
    const data = request.data;
    if (!data.email || !data.password) {
        throw new HttpsError("invalid-argument", "Email and password are required.");
    }

    let userRecord;
    try {
        userRecord = await getAuth().createUser({
            email: data.email,
            password: data.password,
            displayName: `${data.firstName} ${data.lastName}`,
        });
    } catch (error) {
        console.error("Error creating new user:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError("already-exists", "The email address is already in use by another account.");
        }
        throw new HttpsError("internal", "Failed to create authentication user.");
    }

    const newUserDocument = {
        uid: userRecord.uid,
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
        primaryAgency: data.isOtherAffiliated ? data.primaryAgency : (data.isCmspAffiliated ? "Crystal Mountain Ski Patrol" : ""),
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
        await getFirestore().collection("users").doc(userRecord.uid).set(newUserDocument);
        return { status: "success", message: "User created successfully." };
    } catch (error) {
        console.error(`Error creating Firestore document for UID: ${userRecord.uid}`, error);
        await getAuth().deleteUser(userRecord.uid);
        throw new HttpsError("internal", "Failed to save user profile.");
    }
});

/**
 * Allows a logged-in user to enroll themselves in a class.
 */
exports.selfEnroll = onCall(async (request) => {
    const appId = process.env.APP_ID;
    if (!appId) {
        console.error("FATAL ERROR: The APP_ID environment variable is not set.");
        throw new HttpsError('internal', 'The server is missing critical configuration.');
    }

    const { classId } = request.data;
    const uid = request.auth?.uid; // The user enrolling themselves

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to enroll.');
    }
    if (!classId) {
        throw new HttpsError('invalid-argument', 'A "classId" is required.');
    }

    const db = getFirestore();
    const classRef = db.doc(`artifacts/${appId}/public/data/classes/${classId}`);
    const studentRef = db.doc(`users/${uid}`);

    try {
        const classDoc = await classRef.get();
        if (!classDoc.exists || classDoc.data().isHidden) {
            throw new HttpsError('not-found', 'This class is not available for enrollment.');
        }

        const batch = db.batch();
        const enrollmentRef = classRef.collection('enrollments').doc(uid);

        batch.set(enrollmentRef, {
            enrolledAt: FieldValue.serverTimestamp(),
            enrolledBy: uid // The user enrolled themselves
        });
        batch.update(studentRef, {
            enrolledClasses: FieldValue.arrayUnion(classId)
        });

        await batch.commit();

        return { success: true, message: 'You have been successfully enrolled in the class!' };

    } catch (error) {
        console.error(`Error during self-enrollment for user ${uid} in class ${classId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred during enrollment.');
    }
});

/**
 * Deletes a user's account from Firebase Authentication when their corresponding
 * document is deleted from the 'users' collection in Firestore.
 */
const functions = require("firebase-functions");
exports.deleteUserAccount = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
        const deletedUserId = context.params.userId;
        console.log(`Attempting to delete auth user: ${deletedUserId}`);
        try {
            await getAuth().deleteUser(deletedUserId);
            console.log(`Successfully deleted user account with ID: ${deletedUserId}`);
        } catch (error) {
            console.error(`Error deleting user account with ID: ${deletedUserId}`, error);
        }
    });

// Placeholder for the applyShiftTemplate function if you need it.
exports.applyShiftTemplate = onCall(async (request) => {
    console.log("applyShiftTemplate called with data:", request.data);
    return { status: "pending", message: "Function not fully implemented." };
});
