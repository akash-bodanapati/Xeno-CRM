import 'dotenv/config'; // MUST BE FIRST LINE
import express from 'express';
import cors from 'cors';

import sendRouter from './routes/send';
import bulkRouter from './routes/bulk';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/send', sendRouter);
app.use('/bulk', bulkRouter);
app.use('/health', healthRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`[channel-service] running on port ${PORT}`);
});

export default app;
