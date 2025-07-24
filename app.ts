import express from 'express';
import cors from 'cors';
import morgan = require('morgan');

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
import quizRouter from './routes/quizRouter';
import linkRouter from './routes/linkRouter';
import notificationRouter from './routes/notificationRouter';

const app = express();
const apiRoutesBase = '/api/v2';

app.use(morgan('dev')); // logs to console in development
app.use(cors());
app.use(express.json());

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

app.use(globalErrorHandler);

export default app;
