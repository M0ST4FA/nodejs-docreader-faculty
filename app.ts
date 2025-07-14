import express from 'express';
import cors from 'cors';
import morgan = require('morgan');

import globalErrorHandler from './controllers/ErrorController';
import authRouter from './routes/authRouter';
import userRouter from './routes/userRouter';
import facultyRouter from './routes/facultyRouter';
import moduleRouter from './routes/moduleRouter';
import yearRouter from './routes/yearRouter';
import subjectRouter from './routes/subjectRouter';
import lectureRouter from './routes/lectureRouter';
import quizRouter from './routes/quizRouter';
import linkRouter from './routes/linkRouter';

const app = express();

app.use(morgan('dev')); // logs to console in development
app.use(cors());
app.use(express.json());

app.use('/api/v2/', authRouter);
app.use('/api/v2/users', userRouter);
app.use('/api/v2/faculties', facultyRouter);
app.use('/api/v2/years', yearRouter);
app.use('/api/v2/modules', moduleRouter);
app.use('/api/v2/subjects', subjectRouter);
app.use('/api/v2/lectures', lectureRouter);
app.use('/api/v2/quizzes', quizRouter);
app.use('/api/v2/links', linkRouter);

app.use(globalErrorHandler);

export default app;
