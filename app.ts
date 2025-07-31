import express from 'express';
import cors from 'cors';

import ErrorController from './controllers/ErrorController';
import LogController from './controllers/LogController';

import authRouter from './routes/authRouter';
import userRouter from './routes/userRouter';
import roleRouter from './routes/roleRouter';
import permissionRouter from './routes/permissionRouter';
import facultyRouter from './routes/facultyRouter';
import moduleRouter from './routes/moduleRouter';
import yearRouter from './routes/yearRouter';
import subjectRouter from './routes/subjectRouter';
import lectureRouter from './routes/lectureRouter';
import quizRouter from './routes/quizRouter';
import linkRouter from './routes/linkRouter';
import notificationRouter from './routes/notificationRouter';

const app = express();
const apiRoutesBase = '/api/v2';

// LOGGING
// Console logging in development only
if (process.env.NODE_ENV === 'development') app.use(LogController.morgan());

// API logging to database
app.use(LogController.logRequest);

// SECURITY
app.use(cors());

// ESSENTIAL MIDDLEWARE
app.use(express.json());

// ROUTES
app.use(`${apiRoutesBase}/`, authRouter);
app.use(`${apiRoutesBase}/users`, userRouter);
app.use(`${apiRoutesBase}/roles`, roleRouter);
app.use(`${apiRoutesBase}/permissions`, permissionRouter);
app.use(`${apiRoutesBase}/faculties`, facultyRouter);
app.use(`${apiRoutesBase}/years`, yearRouter);
app.use(`${apiRoutesBase}/modules`, moduleRouter);
app.use(`${apiRoutesBase}/subjects`, subjectRouter);
app.use(`${apiRoutesBase}/lectures`, lectureRouter);
app.use(`${apiRoutesBase}/quizzes`, quizRouter);
app.use(`${apiRoutesBase}/links`, linkRouter);
app.use(`${apiRoutesBase}/notifications`, notificationRouter);

// ERROR HANDLING
app.use(ErrorController.globalErrorHandler);

export default app;
