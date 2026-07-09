# ClubFund

Group expense management app with custom splits and minimum-transaction settlement.

## Features
- User Auth (JWT)
- Create groups, add members
- Add expenses with **custom splits per person** (unequal amounts, partial participation)
- Matrix-based net balance computation
- Debt simplification — minimum transactions settlement algorithm
- Settlement history

## Stack
- Frontend: React (CRA), Axios, React Router
- Backend: Node.js, Express, MongoDB, Mongoose, JWT

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## How settlement works
Every expense stores `paidBy` and `splits[]` (who owes how much).
A matrix is built per group: `matrix[owedBy][paidBy] += amount`.
Net balance per person = total owed to them − total they owe.
The debt simplification algorithm then computes the minimum number of payments needed to zero out all balances.
