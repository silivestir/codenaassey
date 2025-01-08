const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process'); // To run JavaScript code in a separate process

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (like HTML, JS, CSS)
app.use(express.static('public'));

// Store the shared code for collaborative editing
let currentCode = 'console.log("Hello, world!");';

// Handle new connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the current code when a new user connects
    socket.emit('document-update', { code: currentCode });

    // Handle real-time collaborative code editing
    socket.on('document-update', (msg) => {
        if (msg.code !== currentCode) {
            currentCode = msg.code; // Update the shared code
            socket.broadcast.emit('document-update', msg); // Broadcast to all users except sender
        }
    });

    // Handle running code on the server using child_process
    socket.on('run-code', (code) => {
        // Save the code to a temporary JavaScript file
        const tempFileName = './tempCode.js';
        const fs = require('fs');
        fs.writeFileSync(tempFileName, code);

        // Execute the JavaScript file in a separate process
        exec(`node ${tempFileName}`, (error, stdout, stderr) => {
            if (error) {
                socket.emit('code-output', `Error: ${stderr}`);
            } else {
                socket.emit('code-output', stdout); // Send the output of the code back to the client
            }

            // Clean up: remove the temporary file
            fs.unlinkSync(tempFileName);
        });
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});