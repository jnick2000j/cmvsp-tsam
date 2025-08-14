const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

// --- MODIFIED: createUserAccount function ---
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


// --- MODIFIED: enrollStudent Function to handle prerequisites and pending approval ---
exports.enrollStudent = onCall(async (request) => {
    const { classId, studentId, prerequisiteSubmissions = {} } = request.data;
    const uid = request.auth.uid;
    const appId = "cmvsp-tsam";

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const db = getFirestore();
    const classRef = db.collection(`artifacts/${appId}/public/data/classes`).doc(classId);
    const studentRef = db.collection('users').doc(studentId);

    const classDoc = await classRef.get();
    if (!classDoc.exists) {
        throw new HttpsError('not-found', 'The specified class could not be found.');
    }

    const classData = classDoc.data();
    const hasPrerequisites = (classData.prerequisites && classData.prerequisites.length > 0)

    try {
        if (hasPrerequisites) {
            await classRef.collection('enrollments').doc(studentId).set({
                status: 'pending',
                enrolledAt: FieldValue.serverTimestamp(),
                submittedBy: uid,
                prerequisiteSubmissions,
            });

            return { success: true, message: 'Enrollment submitted for approval.' };

        } else {
            await classRef.collection('enrollments').doc(studentId).set({
                status: 'approved',
                enrolledAt: FieldValue.serverTimestamp(),
                approvedAt: FieldValue.serverTimestamp(),
                approvedBy: uid,
            });

            await studentRef.update({
                enrolledClasses: FieldValue.arrayUnion(classId)
            });

            return { success: true, message: 'Student enrolled successfully.' };
        }
    } catch (error) {
        console.error("Error during enrollment transaction:", error);
        throw new HttpsError('internal', 'An error occurred while enrolling the student.');
    }
});

// --- NEW: processEnrollmentApproval function ---
exports.processEnrollmentApproval = onCall(async (request) => {
    const { classId, studentId, action } = request.data;
    const uid = request.auth.uid;
    const appId = "cmvsp-tsam";

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const db = getFirestore();
    const classRef = db.collection(`artifacts/${appId}/public/data/classes`).doc(classId);
    const enrollmentRef = classRef.collection('enrollments').doc(studentId);
    const userRef = db.collection('users').doc(studentId);

    const enrollmentDoc = await enrollmentRef.get();
    if (!enrollmentDoc.exists || enrollmentDoc.data().status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Enrollment is not in a pending state.');
    }

    const classDoc = await classRef.get();
    const classData = classDoc.data();
    const isLeadInstructor = classData.leadInstructorId === uid;
    const callingUserDoc = await db.collection('users').doc(uid).get();
    const isAdmin = callingUserDoc.data()?.isAdmin;

    if (!isAdmin && !isLeadInstructor) {
        throw new HttpsError('permission-denied', 'You do not have permission to approve or deny this enrollment.');
    }

    if (action === 'approve') {
        await enrollmentRef.update({
            status: 'approved',
            approvedAt: FieldValue.serverTimestamp(),
            approvedBy: uid,
        });

        await userRef.update({
            enrolledClasses: FieldValue.arrayUnion(classId),
        });

        return { success: true, message: 'Enrollment approved successfully.' };
    } else if (action === 'deny') {
        await enrollmentRef.update({
            status: 'denied',
            deniedAt: FieldValue.serverTimestamp(),
            deniedBy: uid,
        });
        
        return { success: true, message: 'Enrollment denied successfully.' };
    } else {
        throw new HttpsError('invalid-argument', 'Invalid action specified.');
    }
});