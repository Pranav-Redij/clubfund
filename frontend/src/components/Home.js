import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import Navbar from './Navbar';
import '../style/Home.css';

function Home() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [creating, setCreating] = useState(false);

    const token = localStorage.getItem('token');

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/groups/mygroups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);
        } catch (err) {
            alert('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async () => {
        if (!groupName) {
            alert('Group name is required');
            return;
        }
        try {
            setCreating(true);
            await axios.post(`${BASE_URL}/api/groups/create`, {
                name: groupName,
                description: groupDesc
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroupName('');
            setGroupDesc('');
            setShowCreateModal(false);
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="home-container">
                <div className="home-header">
                    <h2 className="home-title">My Groups</h2>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        + Create Group
                    </button>
                </div>

                {loading ? (
                    <p className="home-loading">Loading groups...</p>
                ) : groups.length === 0 ? (
                    <div className="home-empty">
                        <p>No groups yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="groups-grid">
                        {groups.map(group => (
                            <div
                                key={group._id}
                                className="group-card"
                                onClick={() => navigate(`/group/${group._id}`)}
                            >
                                <h3 className="group-card-name">{group.name}</h3>
                                {group.description && (
                                    <p className="group-card-desc">{group.description}</p>
                                )}
                                <p className="group-card-members">
                                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                </p>
                                <div className="group-card-member-list">
                                    {group.members.map(m => (
                                        <span key={m._id} className="member-badge">{m.username}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="modal-title">Create New Group</h3>
                        <input
                            className="modal-input"
                            type="text"
                            placeholder="Group name *"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <input
                            className="modal-input"
                            type="text"
                            placeholder="Description (optional)"
                            value={groupDesc}
                            onChange={(e) => setGroupDesc(e.target.value)}
                        />
                        <div className="modal-buttons">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleCreateGroup} disabled={creating}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
