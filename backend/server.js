const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

connectDB();

//app.use(cors());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://clubfund.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
    res.send('ClubFund API running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
