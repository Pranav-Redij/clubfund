const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const { jwtAuthMiddleware } = require('../jwt');

// ---------- HELPER: compute net balances using matrix logic ----------
// Returns: { userId: netAmount } positive = owed money, negative = owes money
const computeNetBalances = (transactions, settlements, members) => {
    // Initialize matrix: matrix[from][to] = amount from owes to
    const matrix = {};
    members.forEach(a => {
        matrix[a] = {};
        members.forEach(b => { matrix[a][b] = 0; });
    });

    // Fill matrix from transactions
    transactions.forEach(txn => {
        const paidBy = txn.paidBy._id ? txn.paidBy._id.toString() : txn.paidBy.toString();
        txn.splits.forEach(split => {
            const owedBy = split.user._id ? split.user._id.toString() : split.user.toString();
            if (owedBy !== paidBy && matrix[owedBy] && matrix[owedBy][paidBy] !== undefined) {
                matrix[owedBy][paidBy] += split.amount;
            }
        });
    });

    // Subtract settlements (paidBy paid paidTo, so reduce debt)
    settlements.forEach(s => {
        const from = s.paidBy._id ? s.paidBy._id.toString() : s.paidBy.toString();
        const to = s.paidTo._id ? s.paidTo._id.toString() : s.paidTo.toString();
        if (matrix[from] && matrix[from][to] !== undefined) {
            matrix[from][to] = Math.max(0, matrix[from][to] - s.amount);
        }
    });

    // Compute net balance for each member
    const net = {};
    members.forEach(person => { net[person] = 0; });

    members.forEach(a => {
        members.forEach(b => {
            if (a !== b) {
                net[b] += matrix[a][b]; // b is owed this from a
                net[a] -= matrix[a][b]; // a owes this to b
            }
        });
    });

    return net;
};

// Minimum transactions algorithm (debt simplification)
const simplifyDebts = (netBalances) => {
    const creditors = [];
    const debtors = [];

    Object.entries(netBalances).forEach(([userId, amount]) => {
        if (amount > 0.01) creditors.push({ userId, amount });
        else if (amount < -0.01) debtors.push({ userId, amount: -amount });
    });

    const settlements = [];

    while (creditors.length > 0 && debtors.length > 0) {
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        const creditor = creditors[0];
        const debtor = debtors[0];

        const settleAmount = Math.min(creditor.amount, debtor.amount);

        settlements.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: Math.round(settleAmount * 100) / 100
        });

        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;

        if (creditor.amount < 0.01) creditors.shift();
        if (debtor.amount < 0.01) debtors.shift();
    }

    return settlements;
};

// ---------- ROUTES ----------

// POST /api/transactions/add
router.post('/add', jwtAuthMiddleware, async (req, res) => {
    try {
        const { groupId, description, totalAmount, splits } = req.body;

        if (!groupId || !description || !totalAmount || !splits || splits.length === 0) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = group.members.some(m => m.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        // Validate split amounts add up roughly to totalAmount
        const splitSum = splits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitSum - totalAmount) > 1) {
            return res.status(400).json({ message: 'Split amounts do not add up to total amount' });
        }

        const transaction = new Transaction({
            group: groupId,
            paidBy: req.user.id,
            totalAmount,
            description,
            splits
        });
        await transaction.save();

        const populated = await Transaction.findById(transaction._id)
            .populate('paidBy', 'username')
            .populate('splits.user', 'username');

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/transactions/group/:groupId  — all transactions
router.get('/group/:groupId', jwtAuthMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some(m => m.toString() === req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const transactions = await Transaction.find({ group: req.params.groupId })
            .populate('paidBy', 'username')
            .populate('splits.user', 'username')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/transactions/balances/:groupId — net balances + simplified settlement plan
router.get('/balances/:groupId', jwtAuthMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId).populate('members', 'username');
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some(m => m._id.toString() === req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const memberIds = group.members.map(m => m._id.toString());

        const transactions = await Transaction.find({ group: req.params.groupId })
            .populate('paidBy', 'username')
            .populate('splits.user', 'username');

        const settlements = await Settlement.find({ group: req.params.groupId })
            .populate('paidBy', 'username')
            .populate('paidTo', 'username');

        const netBalances = computeNetBalances(transactions, settlements, memberIds);
        const settlementPlan = simplifyDebts(netBalances);

        // Attach usernames to netBalances
        const memberMap = {};
        group.members.forEach(m => { memberMap[m._id.toString()] = m.username; });

        const netBalancesWithNames = Object.entries(netBalances).map(([userId, amount]) => ({
            userId,
            username: memberMap[userId] || 'Unknown',
            netAmount: Math.round(amount * 100) / 100
        }));

        const settlementPlanWithNames = settlementPlan.map(s => ({
            ...s,
            fromUsername: memberMap[s.from] || 'Unknown',
            toUsername: memberMap[s.to] || 'Unknown'
        }));

        res.json({ netBalances: netBalancesWithNames, settlementPlan: settlementPlanWithNames });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/transactions/settle
router.post('/settle', jwtAuthMiddleware, async (req, res) => {
    try {
        const { groupId, paidToId, amount, note } = req.body;

        if (!groupId || !paidToId || !amount) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some(m => m.toString() === req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const settlement = new Settlement({
            group: groupId,
            paidBy: req.user.id,
            paidTo: paidToId,
            amount,
            note: note || ''
        });
        await settlement.save();

        const populated = await Settlement.findById(settlement._id)
            .populate('paidBy', 'username')
            .populate('paidTo', 'username');

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/transactions/settlements/:groupId
router.get('/settlements/:groupId', jwtAuthMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some(m => m.toString() === req.user.id);
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        const settlements = await Settlement.find({ group: req.params.groupId })
            .populate('paidBy', 'username')
            .populate('paidTo', 'username')
            .sort({ createdAt: -1 });

        res.json(settlements);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
