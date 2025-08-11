// This file includes the full waiver management and approval workflow.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore"); // V2 import for Firestore triggers
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { RRule } = require('rrule');
const { defineString } = require('firebase-functions/params');

initializeApp();

const appIdentifier = defineString("APP_ID");

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
        roles: ["Student"],
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
 * Creates a pending enrollment request and checks for required waivers.
 */
exports.enrollInCourse = onCall(async (request) => {
    const { classId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in to enroll.');
    if (!classId) throw new HttpsError('invalid-argument', 'A "classId" is required.');

    const db = getFirestore();
    const appId = appIdentifier.value();
    if (!appId) throw new HttpsError('internal', 'The server is missing critical configuration.');
    
    const classRef = db.doc(`artifacts/${appId}/public/data/classes/${classId}`);
    const studentRef = db.doc(`users/${uid}`);
    const requestRef = db.collection('enrollmentRequests').doc(`${classId}_${uid}`);

    try {
        const [classDoc, studentDoc, requestDoc] = await Promise.all([classRef.get(), studentRef.get(), requestRef.get()]);

        if (!classDoc.exists) throw new HttpsError('not-found', 'The specified class could not be found.');
        if (!studentDoc.exists) throw new HttpsError('not-found', 'Could not find your user profile.');
        if (requestDoc.exists) throw new HttpsError('already-exists', 'You have already submitted a request for this class.');
        
        const classData = classDoc.data();
        if (classData.isClosedForEnrollment) throw new HttpsError('failed-precondition', 'Enrollment is currently closed for this class.');

        // NEW: Check if waivers are required for this class
        const requiredWaivers = classData.requiredWaiverIds || [];
        const status = requiredWaivers.length > 0 ? 'pending_waivers' : 'pending_approval';

        const studentData = studentDoc.data();
        await requestRef.set({
            status: status, // Set status based on waiver requirement
            requestDate: FieldValue.serverTimestamp(),
            userId: uid,
            classId: classId,
            userName: studentData.displayName || `${studentData.firstName} ${studentData.lastName}`,
            className: classData.name,
            leadInstructorId: classData.leadInstructorId || null 
        });

        const message = status === 'pending_waivers' 
            ? 'Enrollment request received. Please sign the required waivers to proceed.'
            : 'Your enrollment request has been submitted for approval.';
        return { success: true, message: message };

    } catch (error) {
        console.error(`Enrollment request error for user ${uid} in class ${classId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'An unexpected error occurred during the request.');
    }
});

/**
 * Approves a pending enrollment request, but only if all waivers are approved.
 */
exports.approveEnrollment = onCall(async (request) => {
    const { requestId } = request.data;
    const approverId = request.auth?.uid;

    if (!approverId) throw new HttpsError('unauthenticated', 'Authentication required to approve.');
    if (!requestId) throw new HttpsError('invalid-argument', 'A "requestId" is required.');

    const db = getFirestore();
    const requestRef = db.collection('enrollmentRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) throw new HttpsError('not-found', 'The enrollment request was not found.');
    
    const { userId, classId } = requestDoc.data();
    const classRef = db.doc(`artifacts/${appIdentifier.value()}/public/data/classes/${classId}`);
    const classSnap = await classRef.get();
    const requiredWaivers = classSnap.data().requiredWaiverIds || [];

    // NEW: Verify all required waivers are signed and approved
    if (requiredWaivers.length > 0) {
        const signedWaiversQuery = await db.collection('signedWaivers')
            .where('userId', '==', userId)
            .where('classId', '==', classId)
            .where('status', '==', 'approved')
            .get();
        
        if (signedWaiversQuery.size !== requiredWaivers.length) {
            throw new HttpsError('failed-precondition', 'Cannot approve enrollment until all required waivers are signed and approved.');
        }
    }

    const studentRef = db.doc(`users/${userId}`);
    const batch = db.batch();
    batch.update(requestRef, { status: 'approved', approvedBy: approverId, approvedAt: FieldValue.serverTimestamp() });
    batch.update(studentRef, { enrolledClasses: FieldValue.arrayUnion(classId) });
    await batch.commit();

    console.log(`TODO: Send approval email to user ${userId} for class ${classId}.`);

    return { success: true, message: "Enrollment approved." };
});

/**
 * Denies a pending enrollment request.
 */
exports.denyEnrollment = onCall(async (request) => {
    const { requestId } = request.data;
    const denierId = request.auth?.uid;

    if (!denierId) throw new HttpsError('unauthenticated', 'Authentication required to deny.');
    if (!requestId) throw new HttpsError('invalid-argument', 'A "requestId" is required.');

    const db = getFirestore();
    const requestRef = db.collection('enrollmentRequests').doc(requestId);
    await requestRef.update({ status: 'denied', deniedBy: denierId, deniedAt: FieldValue.serverTimestamp() });
    
    console.log(`TODO: Send denial email regarding request ${requestId}.`);
    return { success: true, message: "Enrollment denied." };
});

/**
 * Creates a new waiver template. Admin only.
 */
exports.createWaiverTemplate = onCall(async (request) => {
    const { title, content } = request.data;
    const uid = request.auth?.uid;
    // In a real app, you'd verify the user is an admin here
    if (!uid) throw new HttpsError('unauthenticated', 'Admin authentication required.');
    if (!title || !content) throw new HttpsError('invalid-argument', 'Title and content are required.');

    const db = getFirestore();
    await db.collection('waiverTemplates').add({
        title,
        content,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
    });
    return { success: true, message: 'Waiver template created successfully.' };
});

/**
 * Allows a user to electronically sign a waiver for a class.
 */
exports.signWaiver = onCall(async (request) => {
    const { classId, waiverTemplateId, signature } = request.data;
    const uid = request.auth?.uid;

    if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in to sign a waiver.');
    if (!classId || !waiverTemplateId || !signature) throw new HttpsError('invalid-argument', 'Class ID, Waiver ID, and signature are required.');

    const db = getFirestore();
    const waiverRef = db.collection('signedWaivers').doc(`${classId}_${uid}_${waiverTemplateId}`);
    
    await waiverRef.set({
        classId,
        waiverTemplateId,
        userId: uid,
        signature, // This is the user's typed name
        status: 'pending_review',
        signedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Waiver signed and submitted for review.' };
});

/**
 * Allows an instructor/admin to approve a signed waiver.
 */
exports.approveWaiver = onCall(async (request) => {
    const { signedWaiverId } = request.data;
    const approverId = request.auth?.uid;

    if (!approverId) throw new HttpsError('unauthenticated', 'Authentication required.');
    // In a real app, verify the approver is an admin or the class instructor
    
    const db = getFirestore();
    const waiverRef = db.collection('signedWaivers').doc(signedWaiverId);
    
    await waiverRef.update({
        status: 'approved',
        reviewedBy: approverId,
        reviewedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Waiver approved.' };
});


/**
 * Deletes a user's account from Firebase Authentication when their corresponding
 * document is deleted from the 'users' collection in Firestore.
 * This is the updated V2 version.
 */
exports.deleteUserAccount = onDocumentDeleted("users/{userId}", async (event) => {
    const userId = event.params.userId;
    console.log(`Attempting to delete auth user: ${userId}`);
    try {
        await getAuth().deleteUser(userId);
        console.log(`Successfully deleted user account with ID: ${userId}`);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`Auth user with ID: ${userId} not found. It may have already been deleted.`);
        } else {
            console.error(`Error deleting user account with ID: ${userId}`, error);
        }
    }
});


// Placeholder for the applyShiftTemplate function if you need it.
exports.applyShiftTemplate = onCall(async (request) => {
    console.log("applyShiftTemplate called with data:", request.data);
    return { status: "pending", message: "Function not fully implemented." };
});
