// Must be the first import: loads .env before app.ts reads process.env
import 'dotenv/config';
import { connectDB } from './config/db.js';
import { app } from './app.js';
import { hasDemoData, seedDemo } from './demo.js';

const port = process.env.PORT || 3000;

// Establish MongoDB connection before starting the server
connectDB()
  .then(async () => {
    // A fresh demo deployment fills itself on first start
    if (process.env.SEED_DEMO === 'true' && !(await hasDemoData())) {
      await seedDemo();
    }
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
