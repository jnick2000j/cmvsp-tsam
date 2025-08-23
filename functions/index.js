const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

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

exports.enrollStudent = onCall(async (request) => {
    const { classId, studentId, prerequisiteSubmissions = {}, waiverSignatures = {} } = request.data;
    const uid = request.auth.uid;
    const appId = "cmvsp-tsam";

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }

    const db = getFirestore();
    const classRef = db.collection(`artifacts/${appId}/public/data/classes`).doc(classId);
    const studentRef = db.collection('users').doc(studentId);
    const enrollmentRef = classRef.collection('enrollments').doc(studentId);

    const classDoc = await classRef.get();
    if (!classDoc.exists) {
        throw new HttpsError('not-found', 'The specified class could not be found.');
    }
    const classData = classDoc.data();

    const existingEnrollment = await enrollmentRef.get();
    if (existingEnrollment.exists && existingEnrollment.data().status === 'approved') {
        return { success: true, message: 'Student is already enrolled.' };
    }

    // Check for waiver signatures if waivers are required
    const hasWaivers = classData.waiverIds && classData.waiverIds.length > 0;
    if (hasWaivers && Object.keys(waiverSignatures).length !== classData.waiverIds.length) {
        throw new HttpsError('failed-precondition', 'All required waivers must be signed to enroll.');
    }
    
    // Add timestamp to each signature
    const signaturesWithTimestamp = {};
    for (const waiverId in waiverSignatures) {
        signaturesWithTimestamp[waiverId] = {
            signature: waiverSignatures[waiverId],
            signedAt: FieldValue.serverTimestamp()
        };
    }

    try {
        await enrollmentRef.set({
            status: 'approved',
            enrolledAt: FieldValue.serverTimestamp(),
            approvedAt: FieldValue.serverTimestamp(),
            approvedBy: uid,
            prerequisiteSubmissions,
            waiverSignatures: signaturesWithTimestamp,
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