const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://clubfund.onrender.com'
    : 'http://localhost:5001';

export default BASE_URL;
