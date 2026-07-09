import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import Navbar from './Navbar';
import '../style/AddTransaction.css';

function AddTransaction() {
    const { groupId } = useParams();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [splits, setSplits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/groups/${groupId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGroup(res.data);

                // Initialize splits: everyone except paidBy (current user) starts at 0
                const initialSplits = res.data.members
                    .filter(m => m._id !== userId)
                    .map(m => ({ userId: m._id, username: m.username, amount: '' }));
                setSplits(initialSplits);
            } catch (err) {
                alert('Failed to load group');
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [groupId]);

    const handleSplitChange = (index, value) => {
        const updated = [...splits];
        updated[index].amount = value;
        setSplits(updated);
    };

    const getSplitSum = () => {
        return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    };

    const handleSubmit = async () => {
        if (!description || !totalAmount) {
            alert('Description and total amount are required');
            return;
        }

        const total = parseFloat(totalAmount);
        if (isNaN(total) || total <= 0) {
            alert('Enter a valid total amount');
            return;
        }

        const validSplits = splits.filter(s => parseFloat(s.amount) > 0);
        if (validSplits.length === 0) {
            alert('At least one person must owe something');
            return;
        }

        const splitSum = validSplits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
        if (Math.abs(splitSum - total) > 1) {
            alert(`Split amounts (₹${splitSum}) don't match total (₹${total}). Difference: ₹${Math.abs(splitSum - total).toFixed(2)}`);
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${BASE_URL}/api/transactions/add`, {
                groupId,
                description,
                totalAmount: total,
                splits: validSplits.map(s => ({ user: s.userId, amount: parseFloat(s.amount) }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Expense added!');
            navigate(`/group/${groupId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add expense');
        } finally {
            setSubmitting(false);
        }
    };

    const splitSum = getSplitSum();
    const total = parseFloat(totalAmount) || 0;
    const remaining = total - splitSum;

    if (loading) {
        return (
            <div>
                <Navbar />
                <p className="at-loading">Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="at-container">
                <div className="at-card">
                    <h2 className="at-title">Add Expense</h2>
                    <p className="at-group-name">Group: {group?.name}</p>

                    <label className="at-label">Description *</label>
                    <input
                        className="at-input"
                        type="text"
                        placeholder="e.g. Movie tickets, Groceries"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <label className="at-label">Total Amount Paid (₹) *</label>
                    <input
                        className="at-input"
                        type="number"
                        placeholder="Total amount you paid"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                    />

                    <p className="at-paidby-text">
                        Paid by: <strong>{localStorage.getItem('username')}</strong>
                    </p>

                    <div className="at-splits-section">
                        <h3 className="at-splits-title">Who owes how much?</h3>
                        <p className="at-splits-hint">Leave blank if someone didn't participate</p>

                        {splits.map((s, i) => (
                            <div key={s.userId} className="at-split-row">
                                <span className="at-split-name">{s.username}</span>
                                <input
                                    className="at-split-input"
                                    type="number"
                                    placeholder="0"
                                    value={s.amount}
                                    onChange={(e) => handleSplitChange(i, e.target.value)}
                                />
                                <span className="at-split-currency">₹</span>
                            </div>
                        ))}

                        <div className={`at-summary ${Math.abs(remaining) < 1 ? 'at-summary-ok' : 'at-summary-mismatch'}`}>
                            <span>Split total: ₹{splitSum.toFixed(2)}</span>
                            <span>Total: ₹{total.toFixed(2)}</span>
                            <span>Remaining: ₹{remaining.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="at-actions">
                        <button className="btn-secondary" onClick={() => navigate(`/group/${groupId}`)}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddTransaction;
