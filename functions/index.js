const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { RRule } = require('rrule'); // Assuming rrule is in your package.json

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
        // Provides a more specific error message if the email is already in use.
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
        role: "Student", // Default role for new users
        isAdmin: false,
        allowScheduling: false,
        assignments: {},
        enrolledClasses: [],
        completedClasses: {},
        isApproved: false,
        needsApproval: true, // New accounts require admin approval
    };

    try {
        await getFirestore().collection("users").doc(userRecord.uid).set(newUserDocument);
        return { status: "success", message: "User created successfully." };
    } catch (error) {
        console.error(`Error creating Firestore document for UID: ${userRecord.uid}`, error);
        // If Firestore write fails, roll back the auth user creation to prevent orphaned accounts.
        await getAuth().deleteUser(userRecord.uid);
        throw new HttpsError("internal", "Failed to save user profile.");
    }
});

/**
 * Enrolls a student into a class, with permission checks for the calling user.
 */
exports.enrollStudent = onCall(async (request) => {
    const { classId, studentId } = request.data;
    const uid = request.auth?.uid;
    const appId = "cmvsp-tsam"; // Your specific app ID.

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const db = getFirestore();
    // **FIX:** The database path now correctly points to the nested 'classes' collection.
    const classRef = db.doc(`artifacts/${appId}/public/data/classes/${classId}`);
    const studentRef = db.collection('users').doc(studentId);

    const callingUserDoc = await db.collection('users').doc(uid).get();
    if (!callingUserDoc.exists) {
        throw new HttpsError('not-found', 'Calling user record not found.');
    }
    const callingUserData = callingUserDoc.data();
    const isAdmin = callingUserData.isAdmin === true;

    const classDoc = await classRef.get();
    if (!classDoc.exists) {
        throw new HttpsError('not-found', 'The specified class could not be found.');
    }

    const classData = classDoc.data();
    const isLeadInstructor = classData.leadInstructorId === uid;

    // Only admins or the lead instructor of the class can enroll students.
    if (!isAdmin && !isLeadInstructor) {
        throw new HttpsError('permission-denied', 'You do not have permission to enroll students in this class.');
    }

    try {
        await classRef.collection('enrollments').doc(studentId).set({
            enrolledAt: FieldValue.serverTimestamp(),
            enrolledBy: uid
        });

        await studentRef.update({
            enrolledClasses: FieldValue.arrayUnion(classId)
        });

        return { success: true, message: 'Student enrolled successfully.' };
    } catch (error) {
        console.error("Error during enrollment transaction:", error);
        throw new HttpsError('internal', 'An error occurred while enrolling the student.');
    }
});


/**
 * Deletes a user's account from Firebase Authentication when their corresponding
 * document is deleted from the 'users' collection in Firestore.
 * NOTE: This uses 1st Gen syntax because 2nd Gen does not yet support Firestore triggers
 * in the same way. This is a common and acceptable pattern.
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
// You would convert its logic to the 2nd Gen `onCall` syntax as well.
exports.applyShiftTemplate = onCall(async (request) => {
    // ... existing applyShiftTemplate code converted to 2nd Gen ...
    // For now, this is a placeholder.
    console.log("applyShiftTemplate called with data:", request.data);
    return { status: "pending", message: "Function not fully implemented." };
});