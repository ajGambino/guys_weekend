import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { auth } from '../firebase';

const Navbar = () => {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <nav className='navbar'>
            <ul >
                <li>
                    <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : undefined}>
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/place-bet" className={({ isActive }) => isActive ? 'active' : undefined}>
                        Bets
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : undefined}>
                        Results
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'active' : undefined}>
                        Live
                    </NavLink>
                </li>
                {currentUser ? (
                    <li>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </li>
                ) : (
                    <li>
                        <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : undefined}>
                            Login
                        </NavLink>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
