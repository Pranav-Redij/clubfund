import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import Navbar from './Navbar';
import '../style/GroupDetails.css';

function GroupDetails() {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlementPlan, setSettlementPlan] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [activeTab, setActiveTab] = useState('transactions');
    const [loading, setLoading] = useState(true);

    // Add member state
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [addingMember, setAddingMember] = useState(false);

    // Settle modal state
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleToId, setSettleToId] = useState('');
    const [settleToName, setSettleToName] = useState('');
    const [settleAmount, setSettleAmount] = useState('');
    const [settleNote, setSettleNote] = useState('');
    const [settling, setSettling] = useState(false);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    const fetchAll = async () => {
        try {
            const [groupRes, txnRes, balRes, setRes] = await Promise.all([
                axios.get(`${BASE_URL}/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/api/transactions/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/api/transactions/balances/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}/api/transactions/settlements/${groupId}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setGroup(groupRes.data);
            setTransactions(txnRes.data);
            setBalances(balRes.data.netBalances);
            setSettlementPlan(balRes.data.settlementPlan);
            setSettlements(setRes.data);
        } catch (err) {
            alert('Failed to load group data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [groupId]);

    const handleSearchUser = async () => {
        if (!searchQuery) return;
        try {
            const res = await axios.get(`${BASE_URL}/api/users/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(res.data);
        } catch (err) {
            alert('Search failed');
        }
    };

    const handleAddMember = async (memberId) => {
        try {
            setAddingMember(true);
            await axios.post(`${BASE_URL}/api/groups/${groupId}/addmember`, { userId: memberId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Member added successfully');
            setShowAddMember(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const openSettleModal = (toId, toName, suggestedAmount) => {
        setSettleToId(toId);
        setSettleToName(toName);
        setSettleAmount(suggestedAmount || '');
        setSettleNote('');
        setShowSettleModal(true);
    };

    const handleSettle = async () => {
        if (!settleAmount || isNaN(settleAmount) || Number(settleAmount) <= 0) {
            alert('Enter a valid amount');
            return;
        }
        try {
            setSettling(true);
            await axios.post(`${BASE_URL}/api/transactions/settle`, {
                groupId,
                paidToId: settleToId,
                amount: Number(settleAmount),
                note: settleNote
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Settlement recorded!');
            setShowSettleModal(false);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Settlement failed');
        } finally {
            setSettling(false);
        }
    };

    const isCreator = group && group.createdBy && group.createdBy._id
        ? group.createdBy._id === userId
        : group && group.createdBy === userId;

    if (loading) {
        return (
            <div>
                <Navbar />
                <p className="gd-loading">Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="gd-container">

                {/* Group Header */}
                <div className="gd-header">
                    <div>
                        <h2 className="gd-group-name">{group?.name}</h2>
                        {group?.description && <p className="gd-group-desc">{group.description}</p>}
                        <div className="gd-members-row">
                            {group?.members.map(m => (
                                <span key={m._id} className="member-badge">{m.username}</span>
                            ))}
                        </div>
                    </div>
                    <div className="gd-header-actions">
                        {isCreator && (
                            <button className="btn-secondary" onClick={() => setShowAddMember(true)}>
                                + Add Member
                            </button>
                        )}
                        <button className="btn-primary" onClick={() => navigate(`/group/${groupId}/add-transaction`)}>
                            + Add Expense
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="gd-tabs">
                    <button
                        className={`gd-tab ${activeTab === 'transactions' ? 'gd-tab-active' : ''}`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Expenses
                    </button>
                    <button
                        className={`gd-tab ${activeTab === 'balances' ? 'gd-tab-active' : ''}`}
                        onClick={() => setActiveTab('balances')}
                    >
                        Balances
                    </button>
                    <button
                        className={`gd-tab ${activeTab === 'settle' ? 'gd-tab-active' : ''}`}
                        onClick={() => setActiveTab('settle')}
                    >
                        Settle Up
                    </button>
                    <button
                        className={`gd-tab ${activeTab === 'history' ? 'gd-tab-active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>

                {/* Expenses Tab */}
                {activeTab === 'transactions' && (
                    <div className="gd-tab-content">
                        {transactions.length === 0 ? (
                            <p className="gd-empty">No expenses yet. Add one!</p>
                        ) : (
                            transactions.map(txn => (
                                <div key={txn._id} className="txn-card">
                                    <div className="txn-top">
                                        <span className="txn-desc">{txn.description}</span>
                                        <span className="txn-amount">₹{txn.totalAmount}</span>
                                    </div>
                                    <p className="txn-paidby">Paid by <strong>{txn.paidBy.username}</strong></p>
                                    <div className="txn-splits">
                                        {txn.splits.map((s, i) => (
                                            <span key={i} className="split-item">
                                                {s.user.username}: ₹{s.amount}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="txn-date">{new Date(txn.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Balances Tab */}
                {activeTab === 'balances' && (
                    <div className="gd-tab-content">
                        <h3 className="gd-section-title">Net Balances</h3>
                        {balances.map(b => (
                            <div key={b.userId} className="balance-card">
                                <span className="balance-name">{b.username}</span>
                                <span className={`balance-amount ${b.netAmount >= 0 ? 'positive' : 'negative'}`}>
                                    {b.netAmount >= 0 ? `+₹${b.netAmount}` : `-₹${Math.abs(b.netAmount)}`}
                                </span>
                                <span className="balance-label">
                                    {b.netAmount > 0 ? 'gets back' : b.netAmount < 0 ? 'owes' : 'settled'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Settle Up Tab */}
                {activeTab === 'settle' && (
                    <div className="gd-tab-content">
                        <h3 className="gd-section-title">Suggested Settlements (minimum transactions)</h3>
                        {settlementPlan.length === 0 ? (
                            <p className="gd-empty">All settled up!</p>
                        ) : (
                            settlementPlan.map((s, i) => (
                                <div key={i} className="settle-card">
                                    <p className="settle-text">
                                        <strong>{s.fromUsername}</strong> pays <strong>{s.toUsername}</strong>
                                        <span className="settle-amt"> ₹{s.amount}</span>
                                    </p>
                                    {s.from === userId && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => openSettleModal(s.to, s.toUsername, s.amount)}
                                        >
                                            Mark as Paid
                                        </button>
                                    )}
                                </div>
                            ))
                        )}

                        <div className="settle-manual">
                            <h3 className="gd-section-title" style={{ marginTop: '25px' }}>Manual Settlement</h3>
                            <p className="settle-manual-text">Pay someone a custom amount</p>
                            <div className="settle-manual-list">
                                {group?.members
                                    .filter(m => m._id !== userId)
                                    .map(m => (
                                        <button
                                            key={m._id}
                                            className="btn-secondary"
                                            onClick={() => openSettleModal(m._id, m.username, '')}
                                        >
                                            Pay {m.username}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="gd-tab-content">
                        <h3 className="gd-section-title">Settlement History</h3>
                        {settlements.length === 0 ? (
                            <p className="gd-empty">No settlements recorded yet.</p>
                        ) : (
                            settlements.map(s => (
                                <div key={s._id} className="history-card">
                                    <p className="history-text">
                                        <strong>{s.paidBy.username}</strong> paid <strong>{s.paidTo.username}</strong>
                                        <span className="history-amt"> ₹{s.amount}</span>
                                    </p>
                                    {s.note && <p className="history-note">{s.note}</p>}
                                    <p className="history-date">{new Date(s.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="modal-title">Add Member</h3>
                        <div className="search-row">
                            <input
                                className="modal-input"
                                type="text"
                                placeholder="Search by username"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="btn-primary" onClick={handleSearchUser}>Search</button>
                        </div>
                        <div className="search-results">
                            {searchResults.map(u => (
                                <div key={u._id} className="search-result-item">
                                    <span>{u.username}</span>
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleAddMember(u._id)}
                                        disabled={addingMember}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="modal-buttons">
                            <button className="btn-secondary" onClick={() => {
                                setShowAddMember(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settle Modal */}
            {showSettleModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3 className="modal-title">Pay {settleToName}</h3>
                        <input
                            className="modal-input"
                            type="number"
                            placeholder="Amount (₹)"
                            value={settleAmount}
                            onChange={(e) => setSettleAmount(e.target.value)}
                        />
                        <input
                            className="modal-input"
                            type="text"
                            placeholder="Note (optional)"
                            value={settleNote}
                            onChange={(e) => setSettleNote(e.target.value)}
                        />
                        <div className="modal-buttons">
                            <button className="btn-secondary" onClick={() => setShowSettleModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSettle} disabled={settling}>
                                {settling ? 'Saving...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupDetails;
