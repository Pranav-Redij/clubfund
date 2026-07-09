import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import '../style/Signup.css';

function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!username || !email || !password) {
            alert('All fields are required');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${BASE_URL}/api/users/signup`, { username, email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userId', res.data.userId);
            localStorage.setItem('username', res.data.username);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">ClubFund</h2>
                <p className="signup-subtitle">Create your account</p>

                <input
                    className="signup-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="signup-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="signup-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="btn-signup" onClick={handleSignup} disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>

                <p className="signup-login-text">
                    Already have an account?{' '}
                    <Link to="/signin" className="signup-link">Sign In</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
