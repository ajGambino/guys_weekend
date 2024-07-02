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

    const GoogleLogo = () => (
        <svg viewBox="0 0 48 48" width="24px" height="24px">
          <path
            fill="#4285F4"
            d="M24 9.5c3.8 0 6.2 1.6 7.6 2.9l5.6-5.6C33.4 3.6 29.1 2 24 2 14.8 2 7.4 7.8 5 15.4l6.9 5.4C13.6 13 18.3 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M46.5 24c0-1.5-.1-2.9-.3-4.3H24v8.3h12.8c-.6 3.3-2.6 6.1-5.5 8l6.9 5.4C43.1 37.8 46.5 31.4 46.5 24z"
          />
          <path
            fill="#FBBC05"
            d="M12.6 28.7c-1.6-2.4-2.5-5.1-2.5-8s.9-5.6 2.5-8l-6.9-5.4C2.8 11.5 0 17.4 0 24s2.8 12.5 7.7 16.7l6.9-5.4z"
          />
          <path
            fill="#EA4335"
            d="M24 46c6.2 0 11.4-2.1 15.2-5.6l-6.9-5.4c-2.1 1.4-4.8 2.3-8.3 2.3-5.6 0-10.3-3.5-12-8.4l-6.9 5.4C7.4 40.2 14.8 46 24 46z"
          />
        </svg>
      );
      

    return (
        <div className='login'>
            <img src={login}/>
            <button className="google-sign-in" type="button" onClick={handleGoogleLogin}>
              <GoogleLogo /> <span>Sign in with Google</span>
            </button>
           <p>Or</p>
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
                <button className="login-btn" type="submit">Sign in</button>
            </form>
        </div>
    );
};

export default Login;
