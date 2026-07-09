import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/Navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        navigate('/signin');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => navigate('/')}>
                ClubFund
            </div>
            <div className="navbar-right">
                {username && <span className="navbar-username">Hi, {username}</span>}
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}

export default Navbar;
