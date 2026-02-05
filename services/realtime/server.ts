import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-recipe', (recipeId) => {
    socket.join(recipeId);
    console.log(`Socket ${socket.id} joined recipe ${recipeId}`);
  });

  socket.on('toggle-ingredient', ({ recipeId, ingredientIndex, checked }) => {
    // Broadcast to everyone else in the room
    socket.to(recipeId).emit('ingredient-toggled', { ingredientIndex, checked });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Realtime service running on port ${PORT}`);
});