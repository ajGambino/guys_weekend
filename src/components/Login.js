import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);

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
            // Sign in the user with email and password
            await firebase.auth().signInWithEmailAndPassword(email, password);

            // Redirect to the landing page or any other protected route
            navigate('/home');
        } catch (error) {
            setError('Failed to log in');
            console.error('Error logging in:', error);
        }
    };

    return (
        <div className='login'>
            <h1>Login</h1>
            <button type="button" onClick={handleGoogleLogin}>
                Login with Google
            </button> <br></br>
            {error && <p>{error}</p>}
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" value={email} onChange={handleEmailChange} />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" value={password} onChange={handlePasswordChange} />
                </div><br></br>
                <button type="submit">Login</button>
            </form>

            {/*  <p>
                Don't have an account? <Link to="/signup">Sign up now</Link>
    </p> */}
        </div>
    );
};

export default Login;
