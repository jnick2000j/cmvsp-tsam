// src/components/AuthComponent.js
import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    OAuthProvider,
    signInWithPopup 
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const AuthComponent = ({ logoUrl, loginTitle, authMessage, setAuthMessage }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [isCmspAffiliated, setIsCmspAffiliated] = useState(false);
    const [isOtherAffiliated, setIsOtherAffiliated] = useState(false);
    const [primaryAgency, setPrimaryAgency] = useState('');
    const [nspId, setNspId] = useState('');

    const clearFormState = () => {
        setError('');
        setAuthMessage('');
    };

    const handleCmspAffiliationChange = (checked) => {
        setIsCmspAffiliated(checked);
        if (checked) setIsOtherAffiliated(false);
    };

    const handleOtherAffiliationChange = (checked) => {
        setIsOtherAffiliated(checked);
        if (checked) setIsCmspAffiliated(false);
    };

    const handleEntraIdLogin = async () => {
        clearFormState();
        const provider = new OAuthProvider('microsoft.com');
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        clearFormState();

        if (isPasswordReset) { /* ... */ }

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                setError(err.message);
            }
        } else { // Registration logic
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            try {
                const functions = getFunctions();
                const createUserAccount = httpsCallable(functions, 'createUserAccount');
                
                const registrationData = {
                    email,
                    password,
                    firstName,
                    lastName,
                    phone,
                    address,
                    city,
                    state,
                    zip,
                    isCmspAffiliated,
                    isOtherAffiliated,
                    primaryAgency,
                    nspId,
                };
                
                // Call the Cloud Function with the user's data
                const result = await createUserAccount(registrationData);

                if (result.data.status === 'success') {
                    setAuthMessage("Your account request has been submitted and is pending approval.");
                    setIsLogin(true);
                } else {
                    setError(result.data.message || "An unknown error occurred.");
                }
                
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
                    <h2 className="text-3xl font-bold text-gray-800">{isPasswordReset ? 'Reset Password' : isLogin ? loginTitle : 'Request Access'}</h2>
                </div>

                {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm text-center">{error}</p>}
                {authMessage && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm text-center">{authMessage}</p>}

                {isLogin && (
                    <div className="space-y-4">
                        <button
                            onClick={handleEntraIdLogin}
                            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#f25022" d="M1 1h9v9H1z"/>
                                <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                                <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                                <path fill="#ffb900" d="M11 11h9v9h-9z"/>
                            </svg>
                            Login with your CMVSP E-Mail Address
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or with email</span></div>
                        </div>
                    </div>
                )}


                <form onSubmit={handleAuthAction} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 border rounded-lg" />
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 border rounded-lg" />
                            </div>
                        </>
                    )}

                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 border rounded-lg" />

                    {!isPasswordReset && (
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border rounded-lg" />
                    )}

                    {!isLogin && (
                         <>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="w-full px-4 py-3 border rounded-lg" />
                             <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Phone" type="tel" required className="w-full px-4 py-3 border rounded-lg" />
                            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street Address" required className="w-full px-4 py-3 border rounded-lg" />
                            <div className="grid grid-cols-3 gap-4">
                                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required className="w-full px-4 py-3 border rounded-lg" />
                                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" required maxLength="2" className="w-full px-4 py-3 border rounded-lg" />
                                <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Zip Code" required className="w-full px-4 py-3 border rounded-lg" />
                            </div>
                            
                            <div className="pt-4 border-t space-y-3">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={isCmspAffiliated} onChange={(e) => handleCmspAffiliationChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                    <span className="ml-2 text-sm text-gray-700">I am affiliated with the Crystal Mountain Ski Patrol but do NOT have a CMVSP E-Mail Address</span>
                                </label>

                                <label className="flex items-center">
                                    <input type="checkbox" checked={isOtherAffiliated} onChange={(e) => handleOtherAffiliationChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                    <span className="ml-2 text-sm text-gray-700">I am affiliated with an NSP Patrol or First Responder Agency</span>
                                </label>

                                {isOtherAffiliated && (
                                    <div className="space-y-4 pt-2">
                                        <input value={primaryAgency} onChange={(e) => setPrimaryAgency(e.target.value)} placeholder="Patrol or Agency Name" required={isOtherAffiliated} className="w-full px-4 py-3 border rounded-lg" />
                                        <input value={nspId} onChange={(e) => setNspId(e.target.value)} placeholder="NSP Identification Number" required={isOtherAffiliated} className="w-full px-4 py-3 border rounded-lg" />
                                    </div>
                                )}
                            </div>
                         </>
                    )}

                    <button type="submit" className="w-full py-3 text-white bg-primary hover:bg-primary-hover rounded-lg font-semibold">
                        {isPasswordReset ? 'Send Reset Email' : isLogin ? 'Login' : 'Request Access'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    {isLogin ? (
                        <>
                            <button onClick={() => { setIsLogin(false); clearFormState(); }} className="font-medium text-accent hover:text-accent-hover">Request Access to Crystal Mountain TSAM</button>
                            <br/>
                            <button onClick={() => { setIsPasswordReset(true); clearFormState(); }} className="font-medium text-accent hover:text-accent-hover mt-2">Forgot Password?</button>
                        </>
                    ) : (
                        <button onClick={() => { setIsLogin(true); clearFormState(); }} className="font-medium text-accent hover:text-accent-hover">Already have an account? Login</button>
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