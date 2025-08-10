const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
// Make sure you have installed rrule: npm install rrule
const { RRule } = require('rrule');

initializeApp();

// --- Original Function for User Creation ---
exports.createUserAccount = onCall(async (request) => {
    const { data } = request;
    const { email, password, firstName, lastName, phone, address, city, state, zip, nspId, isCmspAffiliated, isOtherAffiliated, primaryAgency } = data;

    if (!email || !password) {
        throw new HttpsError("invalid-argument", "Email and password are required.");
    }

    let userRecord;
    try {
        userRecord = await getAuth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        const newUserDocument = {
            uid: userRecord.uid,
            email,
            firstName: firstName || "",
            lastName: lastName || "",
            phone: phone || "",
            address: address || "",
            city: city || "",
            state: state || "",
            zip: zip || "",
            nspId: isOtherAffiliated ? nspId : "",
            isAffiliated: isCmspAffiliated,
            primaryAgency: isOtherAffiliated ? primaryAgency : (isCmspAffiliated ? "Crystal Mountain Ski Patrol" : ""),
            role: "Student",
            isAdmin: false,
            allowScheduling: false,
            assignments: {},
            enrolledClasses: [],
            completedClasses: {},
            isApproved: false,
            needsApproval: true,
        };

        await getFirestore().collection("users").doc(userRecord.uid).set(newUserDocument);

        return { status: "success", message: "User created successfully." };
    } catch (error) {
        console.error("Error creating new user:", error);
        if (userRecord && userRecord.uid) {
            await getAuth().deleteUser(userRecord.uid).catch(err => console.error('Cleanup failed for auth user:', err));
        }
        throw new HttpsError("internal", "Failed to create user.", error.message);
    }
});

// --- Function for Manual Class Enrollment ---
exports.enrollStudent = onCall(async (request) => {
    const { classId, studentId } = request.data;
    const uid = request.auth.uid;
    
    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to enroll students.');
    }
    
    // Fetch the calling user's custom claims to check their role
    const user = await getAuth().getUser(uid);
    const userRole = user.customClaims.role;

    const db = getFirestore();
    const classRef = db.collection('classes').doc(classId);

    if (userRole === 'admin') {
        // Admins can enroll any student in any class
        await classRef.collection('enrollments').doc(studentId).set({
            enrolledAt: FieldValue.serverTimestamp(),
            enrolledBy: uid
        });
        return { success: true, message: 'Student enrolled successfully.' };
    } else if (userRole === 'instructor') {
        // Instructors can only enroll students in classes they lead
        const classDoc = await classRef.get();
        if (!classDoc.exists) {
            throw new HttpsError('not-found', 'Class not found.');
        }

        if (classDoc.data().leadInstructorId === uid) {
            await classRef.collection('enrollments').doc(studentId).set({
                enrolledAt: FieldValue.serverTimestamp(),
                enrolledBy: uid
            });
            return { success: true, message: 'Student enrolled successfully.' };
        } else {
            throw new HttpsError('permission-denied', 'You are not the lead instructor for this class.');
        }
    } else {
        throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }
});

// --- Function for Applying Shift Templates ---
exports.applyShiftTemplate = onCall(async (request) => {
    const { templateId, startDate, endDate } = request.data;
    const uid = request.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }
    if (!templateId || !startDate || !endDate) {
        throw new HttpsError('invalid-argument', 'Template ID, start date, and end date are required.');
    }

    const db = getFirestore();
    const templateRef = db.collection('shiftTemplates').doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
        throw new HttpsError('not-found', 'The specified shift template was not found.');
    }

    const template = templateDoc.data();
    const { recurrence, assignments, patrol, name, roles } = template;

    const ruleOptions = {
        dtstart: new Date(startDate),
        until: new Date(endDate),
    };

    if (recurrence.type === 'weekly') {
        ruleOptions.freq = RRule.WEEKLY;
        ruleOptions.interval = recurrence.interval || 1;
        ruleOptions.byweekday = (recurrence.days || []).map(day => RRule[day]);
    } else if (recurrence.type === 'monthly') {
        ruleOptions.freq = RRule.MONTHLY;
        ruleOptions.interval = recurrence.interval || 1;
    } else {
         throw new HttpsError('invalid-argument', 'Invalid recurrence type specified in the template.');
    }

    const rule = new RRule(ruleOptions);
    const dates = rule.all();

    if (dates.length === 0) {
        return { success: false, message: 'No shifts fall within the specified date range and recurrence pattern.' };
    }

    const batch = db.batch();

    dates.forEach(date => {
        const shiftId = `${patrol}-${date.toISOString().split('T')[0]}`;
        const shiftRef = db.collection('shifts').doc(shiftId);
        
        batch.set(shiftRef, {
            date: date,
            patrolId: patrol,
            templateName: name,
            roles: roles,
            assignments: assignments,
            createdAt: new Date(),
            createdBy: uid,
        });
    });

    await batch.commit();

    return { success: true, message: `Successfully applied template and created ${dates.length} shifts.` };
});