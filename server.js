const express = require('express');
const { google } = require('googleapis');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
// const dotenv = require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow frontend to connect
        methods: ['GET', 'POST']
    }
});

app.use(cors()); // Enable CORS
app.use(express.json());

const SHEET_ID = "140cGXOjcLm00Ikt6vxLahAu_IXN6kwrRfkOs-slMn6I"; // Replace with your actual Google Sheet ID

// Google API Authentication
const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json', // Replace with your service account JSON
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Function to fetch data from Google Sheets
async function getSheetData() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A1:B7', // Change the range based on your needs
    });

    return response.data.values;
}

// Webhook Endpoint - Triggered by Google Apps Script
app.post('/webhook', async (req, res) => {
    console.log('🔔 Webhook triggered:', req.body); // Debugging line

    const data = await getSheetData();
    io.emit('update', data);

    res.status(200).send('OK');
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id); // Debugging
    socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
