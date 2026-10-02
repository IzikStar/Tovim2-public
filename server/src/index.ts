// Must be the first import: loads .env before app.ts reads process.env
import 'dotenv/config';
import { connectDB } from './config/db.js';
import { app } from './app.js';

const port = process.env.PORT || 3000;

// Establish MongoDB connection before starting the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
