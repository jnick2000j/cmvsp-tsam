const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, arrayUnion } = require("firebase-admin/firestore");
const { RRule } = require('rrule'); // Assuming you have this from the previous step

initializeApp();

// --- Converted from your original file to 2nd Gen syntax ---
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


// --- NEW: enrollStudent Function (Corrected Logic) ---
exports.enrollStudent = onCall(async (request) => {
    const { classId, studentId } = request.data;
    const uid = request.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const db = getFirestore();
    const classRef = db.collection('classes').doc(classId);
    const studentRef = db.collection('users').doc(studentId);

    const callingUserRecord = await getAuth().getUser(uid);
    const userRole = callingUserRecord.customClaims?.role;

    const classDoc = await classRef.get();
    if (!classDoc.exists) {
        throw new HttpsError('not-found', 'The specified class could not be found.');
    }

    const classData = classDoc.data();
    const isLeadInstructor = classData.leadInstructorIds?.includes(uid);

    if (userRole !== 'admin' && !isLeadInstructor) {
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

// --- This function would also be here from the previous steps ---
exports.applyShiftTemplate = onCall(async (request) => {
    // ... existing applyShiftTemplate code ...
});