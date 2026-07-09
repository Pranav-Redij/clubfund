import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Home from './components/Home';
import GroupDetails from './components/GroupDetails';
import AddTransaction from './components/AddTransaction';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/signin" />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                <Route path="/group/:groupId" element={
                    <ProtectedRoute>
                        <GroupDetails />
                    </ProtectedRoute>
                } />
                <Route path="/group/:groupId/add-transaction" element={
                    <ProtectedRoute>
                        <AddTransaction />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
