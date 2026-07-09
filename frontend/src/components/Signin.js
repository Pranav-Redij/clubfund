import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import '../style/Signin.css';

function Signin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignin = async () => {
        if (!email || !password) {
            alert('All fields are required');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${BASE_URL}/api/users/signin`, { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userId', res.data.userId);
            localStorage.setItem('username', res.data.username);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || 'Signin failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signin-container">
            <div className="signin-card">
                <h2 className="signin-title">ClubFund</h2>
                <p className="signin-subtitle">Sign in to your account</p>

                <input
                    className="signin-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="signin-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="btn-signin" onClick={handleSignin} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="signin-signup-text">
                    Don't have an account?{' '}
                    <Link to="/signup" className="signin-link">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

export default Signin;
