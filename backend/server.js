const express = require('express');
const cors = require('cors');
const connectDB = require('./database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const responseRoutes = require('./routes/responses');
const commentRoutes = require('./routes/comments');
const tunnelRoutes = require('./routes/tunnels');
const webhookRoutes = require('./routes/webhooks');
const webhookReceiverRoutes = require('./routes/webhookReceiver');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/tunnels', tunnelRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/webhook', webhookReceiverRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
