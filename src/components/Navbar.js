import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';


const Navbar = () => {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Sign out the user
            await firebase.auth().signOut();

            // Redirect to the login page or any other desired page
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <nav className='navbar'>
            <ul>
                <li>
                    <Link to="/home">Home</Link>
                </li>
                <li>
                    <Link to="/place-bet">Place Bet</Link>
                </li>
                <li>
                    <Link to="/results">Results</Link>
                </li>
                <li>
                    <Link to="/Leaderboard">Leaderboard</Link>
                </li>
                {currentUser ? (
                    <li>
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                ) : (
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;