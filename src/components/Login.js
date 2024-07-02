import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import {  doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure you import your Firestore instance
import login from '../login.png'

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = getAuth();

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                // Create user object in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName,
                    net: 0
                });
            }

            navigate('/home');
        } catch (error) {
            setError('Failed to log in with Google');
            console.error('Error logging in with Google:', error);
        }
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                // Create user object in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || 'Unknown',
                    net: 0
                });
            }

            navigate('/home');
        } catch (error) {
            setError('Failed to log in');
            console.error('Error logging in:', error);
        }
    };

    return (
        <div className='login'>
            <img src={login}/>
            <button type="button" onClick={handleGoogleLogin}>
                Sign in with Google
            </button>
           
            {error && <p>{error}</p>}
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" value={email} onChange={handleEmailChange} />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" value={password} onChange={handlePasswordChange} />
                </div>
                <br />
                <button type="submit">Sign in</button>
            </form>
        </div>
    );
};

export default Login;
