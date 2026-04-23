// src/server.js
// Entry point for DIETORA Backend

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 DIETORA Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base: http://localhost:${PORT}/api/v1\n`);
    });

    // ─── Graceful Shutdown ─────────────────────────────────
    const gracefulShutdown = (signal) => {
      console.log(`\n[🔴] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed.');
        } catch (err) {
          console.error('❌ Error closing MongoDB:', err.message);
        }
        console.log('👋 DIETORA server shut down. Goodbye!');
        process.exit(0);
      });

      // Force kill after 10 seconds if server won't close
      setTimeout(() => {
        console.error('❌ Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

