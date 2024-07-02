import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { auth } from '../firebase'; // Correct import of auth

const Navbar = () => {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Sign out the user
            await auth.signOut();

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
                    <NavLink to="/home" activeClassName="active">Home</NavLink>
                </li>
                <li>
                    <NavLink to="/place-bet" activeClassName="active">Bets</NavLink>
                </li>
                <li>
                    <NavLink to="/results" activeClassName="active">Results</NavLink>
                </li>
                <li>
                    <NavLink to="/Leaderboard" activeClassName="active">Live</NavLink>
                </li>
                {currentUser ? (
                    <li>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </li>
                ) : (
                    <li>
                        <NavLink to="/login" activeClassName="active">Login</NavLink>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
