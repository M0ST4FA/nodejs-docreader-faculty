import express from 'express';
import cors from 'cors';
import morgan = require('morgan');
import cookieParser from 'cookie-parser';
import path from 'path';

import globalErrorHandler from './controllers/ErrorController';
import authRouter from './routes/authRouter';
import userRouter from './routes/userRouter';
import roleRouter from './routes/roleRouter';
import permissionRouter from './routes/permissionRouter';
import facultyRouter from './routes/facultyRouter';
import moduleRouter from './routes/moduleRouter';
import yearRouter from './routes/yearRouter';
import subjectRouter from './routes/subjectRouter';
import lectureRouter from './routes/lectureRouter';
import mcqQuizRouter from './routes/mcqQuizRouter';
import writtenQuizRouter from './routes/writtenQuizRouter';
import linkRouter from './routes/linkRouter';

const app = express();
const apiRoutesBase = '/api/v2';

// Morgan logging settings
morgan.token('user-id', (req: any) => {
  // Assuming you've already attached req.user in middleware
  return req.user?.id || 'anonymous';
});

const formatWithUser =
  '[:date[iso]] user.id=:user-id raddr=:remote-addr :method :url :status - rtime=:response-time ms referrer=":referrer" uagent=":user-agent"';

app.use(morgan(formatWithUser));

// Security
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    allowedHeaders: [
      'Access-Control-Allow-Origin',
      'Content-Type',
      'Authorization',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);

// Essential middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './public')));

// Routes
app.use(`${apiRoutesBase}/`, authRouter);
app.use(`${apiRoutesBase}/users`, userRouter);
app.use(`${apiRoutesBase}/roles`, roleRouter);
app.use(`${apiRoutesBase}/permissions`, permissionRouter);
app.use(`${apiRoutesBase}/faculties`, facultyRouter);
app.use(`${apiRoutesBase}/years`, yearRouter);
app.use(`${apiRoutesBase}/modules`, moduleRouter);
app.use(`${apiRoutesBase}/subjects`, subjectRouter);
app.use(`${apiRoutesBase}/lectures`, lectureRouter);
app.use(`${apiRoutesBase}/`, mcqQuizRouter);
app.use(`${apiRoutesBase}/`, writtenQuizRouter);
app.use(`${apiRoutesBase}/links`, linkRouter);

// Error handling
app.use(globalErrorHandler);

export default app;
