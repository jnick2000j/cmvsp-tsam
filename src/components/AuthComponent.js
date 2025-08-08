// src/components/AuthComponent.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { UserPlus, LogIn, Mail, ArrowLeft } from 'lucide-react';
import { INSTRUCTOR_ROLES, SUPPORT_ROLES, appId } from '../constants';

const AuthComponent = ({ logoUrl, loginTitle }) => {
    const [authView, setAuthView] = useState('login');
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', address: '', city: '', state: '', zip: '', phone: '', nspId: '', isAffiliated: true, primaryAgency: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                firstName: formData.firstName, lastName: formData.lastName, email: userCredential.user.email,
                address: formData.address, city: formData.city, state: formData.state, zip: formData.zip,
                phone: formData.phone, role: 'Student', uid: userCredential.user.uid,
                nspId: formData.nspId, isAffiliated: formData.isAffiliated, primaryAgency: formData.isAffiliated ? '' : formData.primaryAgency,
                assignments: {},
                isApproved: true,
                enrolledClasses: [],
                completedClasses: {},
            });
            
            await signOut(auth);

            setMessage('Account created! A verification email has been sent. Please verify your email before logging in.');
            setAuthView('login');
        } catch (err) { setError(err.message); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            if (!userCredential.user.emailVerified) {
                await signOut(auth);
                setError("Your email has not been verified. Please check your inbox for a verification link.");
            }
        } catch (err) { setError(err.message); }
    };
    
    const handleMicrosoftLogin = async () => {
        setError('');
        setMessage('');
        try {
            const provider = new OAuthProvider('microsoft.com');
            provider.setCustomParameters({
                tenant: '2158a34b-cbe9-4f50-9e59-4484e1903938', 
            });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const [firstName, lastName] = user.displayName.split(' ');
                await setDoc(userDocRef, {
                    firstName: firstName || '',
                    lastName: lastName || '',
                    email: user.email,
                    role: 'Student',
                    uid: user.uid,
                    isApproved: true,
                    assignments: {},
                    enrolledClasses: [],
                    completedClasses: {},
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePasswordReset = async (e) => { 
        e.preventDefault(); 
        setError(''); 
        setMessage(''); 
        try { 
            await sendPasswordResetEmail(auth, formData.email); 
            setMessage('Password reset email sent!'); 
        } catch (err) { 
            setError(err.message); 
        } 
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="flex justify-center mb-4">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 w-auto" />}
                </div>
                {authView === 'login' && (<form onSubmit={handleLogin} className="space-y-6">
                    <div className="text-center"><h1 className="text-3xl font-bold text-gray-800">{loginTitle || 'Welcome Back'}</h1><p className="text-gray-500 mt-2">Sign in to continue</p></div>
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
                    {message && <p className="text-green-500 bg-green-50 p-3 rounded-lg">{message}</p>}
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" required className="w-full px-4 py-3 border rounded-lg" />
                    <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Password" required className="w-full px-4 py-3 border rounded-lg" />
                    <button type="submit" className="w-full flex justify-center items-center py-3 text-white bg-primary hover:bg-primary-hover rounded-lg"><LogIn className="mr-2 h-5 w-5" />Sign In</button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or</span>
                        </div>
                    </div>

                    <button type="button" onClick={handleMicrosoftLogin} className="w-full flex justify-center items-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 1.052v8.4H2.1V1.052h8.4zm0 9.45v8.4H2.1v-8.4h8.4zm9.45-9.45v8.4h-8.4V1.052h8.4zm0 9.45v8.4h-8.4v-8.4h8.4z" fill="#f25022"/><path d="M10.5 1.052v8.4H2.1V1.052h8.4zm0 9.45v8.4H2.1v-8.4h8.4zm9.45-9.45v8.4h-8.4V1.052h8.4zm0 9.45v8.4h-8.4v-8.4h8.4z" fill-opacity=".6" fill="#00a4ef"/><path d="M10.5 1.052v8.4H2.1V1.052h8.4zm0 9.45v8.4H2.1v-8.4h8.4zm9.45-9.45v8.4h-8.4V1.052h8.4zm0 9.45v8.4h-8.4v-8.4h8.4z" fill-opacity=".4" fill="#7fba00"/><path d="M10.5 1.052v8.4H2.1V1.052h8.4zm0 9.45v8.4H2.1v-8.4h8.4zm9.45-9.45v8.4h-8.4V1.052h8.4zm0 9.45v8.4h-8.4v-8.4h8.4z" fill-opacity=".2" fill="#ffb900"/></svg>
                        Crystal Mountain Patrol Login
                    </button>

                    <div className="text-sm text-center"><a href="#" onClick={(e) => {e.preventDefault(); setAuthView('forgot')}} className="font-medium text-accent hover:text-accent-hover">Forgot password?</a></div>
                    <div className="text-sm text-center text-gray-500">Don't have an account? <a href="#" onClick={(e) => {e.preventDefault(); setAuthView('signup')}} className="font-medium text-accent hover:text-accent-hover">Sign up</a></div>
                </form>)}

                {authView === 'signup' && (<form onSubmit={handleSignUp} className="space-y-4">
                    <div className="text-center"><h1 className="text-3xl font-bold text-gray-800">Create Account</h1><p className="text-gray-500 mt-2">Get started</p></div>
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
                    <div className="flex gap-4"><input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full px-4 py-2 border rounded-lg" /><input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full px-4 py-2 border rounded-lg" /></div>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" required className="w-full px-4 py-2 border rounded-lg" />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Cell Phone Number" className="w-full px-4 py-2 border rounded-lg" />
                    <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Street Address" className="w-full px-4 py-2 border rounded-lg" />
                    <div className="flex gap-4"><input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="w-full px-4 py-2 border rounded-lg" /><input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className="w-full px-4 py-2 border rounded-lg" /><input name="zip" value={formData.zip} onChange={handleInputChange} placeholder="Zip Code" className="w-full px-4 py-2 border rounded-lg" /></div>
                    <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Password" required className="w-full px-4 py-2 border rounded-lg" /><input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" required className="w-full px-4 py-2 border rounded-lg" />
                    <div className="border-t pt-4 space-y-4">
                        <input name="nspId" value={formData.nspId} onChange={handleInputChange} placeholder="National Ski Patrol ID #" className="w-full px-4 py-2 border rounded-lg" />
                        <div className="flex items-center">
                            <input type="checkbox" name="isAffiliated" id="isAffiliated" checked={formData.isAffiliated} onChange={handleInputChange} className="h-4 w-4 text-primary border-gray-300 rounded" />
                            <label htmlFor="isAffiliated" className="ml-2 block text-sm text-gray-900">I am affiliated with Crystal Mountain Ski Patrol</label>
                        </div>
                        {!formData.isAffiliated && (<input name="primaryAgency" value={formData.primaryAgency} onChange={handleInputChange} placeholder="Primary Agency / Patrol" className="w-full px-4 py-2 border rounded-lg" />)}
                    </div>
                    <button type="submit" className="w-full flex justify-center items-center py-3 text-white bg-primary hover:bg-primary-hover rounded-lg"><UserPlus className="mr-2 h-5 w-5" />Create Account</button>
                    <div className="text-sm text-center text-gray-500">Already have an account? <a href="#" onClick={(e) => {e.preventDefault(); setAuthView('login')}} className="font-medium text-accent hover:text-accent-hover">Sign in</a></div>
                </form>)}
                
                {authView === 'forgot' && (<form onSubmit={handlePasswordReset} className="space-y-6">
                    <div className="text-center"><h1 className="text-3xl font-bold text-gray-800">Reset Password</h1><p className="text-gray-500 mt-2">Enter your email for a reset link</p></div>
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}{message && <p className="text-green-500 bg-green-50 p-3 rounded-lg">{message}</p>}
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" required className="w-full px-4 py-3 border rounded-lg" />
                    <button type="submit" className="w-full flex justify-center items-center py-3 text-white bg-primary hover:bg-primary-hover rounded-lg"><Mail className="mr-2 h-5 w-5" />Send Reset Link</button>
                    <div className="text-sm text-center"><a href="#" onClick={(e) => {e.preventDefault(); setAuthView('login')}} className="font-medium text-accent hover:text-accent-hover flex items-center justify-center"><ArrowLeft className="mr-1 h-4 w-4"/>Back to login</a></div>
                </form>)}
            </div>
        </div>
    );
};

export default AuthComponent;
