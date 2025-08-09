// src/components/AuthComponent.js
import React, { useState } from 'react';
import { auth, db, firebaseConfig } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, getAuth } from "firebase/auth";
import { setDoc, doc } from 'firebase/firestore';
import { INSTRUCTOR_ROLES } from '../constants';
import { initializeApp } from 'firebase/app';

const AuthComponent = ({ logoUrl, loginTitle, loginError }) => { // Added loginError prop
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nspId, setNspId] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isPasswordReset, setIsPasswordReset] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (isPasswordReset) {
            try {
                await sendPasswordResetEmail(auth, email);
                setMessage('Password reset email sent! Please check your inbox.');
                setIsPasswordReset(false);
            } catch (err) {
                setError(err.message);
            }
            return;
        }

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                setError(err.message);
            }
        } else {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (password.length < 6) {
                setError("Password must be at least 6 characters long.");
                return;
            }
            try {
                const tempAppName = `temp-user-creation-${Date.now()}`;
                const tempApp = initializeApp(firebaseConfig, tempAppName);
                const tempAuth = getAuth(tempApp);

                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                
                // Don't send verification email until admin approves
                // await sendEmailVerification(userCredential.user);
                setMessage("Registration successful! Your account is now pending administrator approval. You will be notified once it has been approved.");
                
                const newUser = {
                    uid: userCredential.user.uid,
                    firstName,
                    lastName,
                    email,
                    nspId,
                    role: 'Student',
                    isAdmin: false,
                    isAffiliated: false, 
                    primaryAgency: '',
                    assignments: {},
                    enrolledClasses: [],
                    completedClasses: {},
                    isApproved: false, // Set isApproved to false
                    needsApproval: true // Set needsApproval to true
                };
                await setDoc(doc(db, "users", userCredential.user.uid), newUser);

                // Switch back to the login view after successful registration
                setIsLogin(true);
                
            } catch (err) {
                setError(err.message);
            }
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="mx-auto h-20 w-auto mb-4"/>}
                    <h2 className="text-3xl font-bold text-gray-800">{isPasswordReset ? 'Reset Password' : loginTitle}</h2>
                </div>

                {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm text-center">{error}</p>}
                {loginError && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm text-center">{loginError}</p>}
                {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm text-center">{message}</p>}

                <form onSubmit={handleAuthAction} className="space-y-4">
                    {!isPasswordReset && (
                        <>
                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 border rounded-lg" />
                                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 border rounded-lg" />
                                </div>
                            )}
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 border rounded-lg" />
                             {!isLogin && (
                                <input value={nspId} onChange={(e) => setNspId(e.target.value)} placeholder="National Ski Patrol ID #" className="w-full px-4 py-3 border rounded-lg" />
                            )}
                        </>
                    )}

                    {!isPasswordReset ? (
                         <>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border rounded-lg" />
                            {!isLogin && (
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="w-full px-4 py-3 border rounded-lg" />
                            )}
                        </>
                    ) : (
                         <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full px-4 py-3 border rounded-lg" />
                    )}
                   

                    <button type="submit" className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg font-semibold">
                        {isPasswordReset ? 'Send Reset Email' : isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    {isLogin ? (
                        <>
                            <button onClick={() => { setIsLogin(false); setError(''); setMessage(''); }} className="font-medium text-accent hover:text-accent-hover">Don't have an account? Register</button>
                            <br/>
                            <button onClick={() => { setIsPasswordReset(true); setError(''); setMessage(''); }} className="font-medium text-accent hover:text-accent-hover mt-2">Forgot Password?</button>
                        </>
                    ) : (
                        <button onClick={() => { setIsLogin(true); setError(''); setMessage(''); }} className="font-medium text-accent hover:text-accent-hover">Already have an account? Login</button>
                    )}
                     {isPasswordReset && (
                        <button onClick={() => setIsPasswordReset(false)} className="font-medium text-accent hover:text-accent-hover mt-2">Back to Login</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthComponent;