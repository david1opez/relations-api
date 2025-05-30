import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// UTILS
import { StartServer } from './utils/ExpressUtils';

// ROUTES
import Users from './routes/Users';
import Auth from './routes/Auth';

const app = express();
dotenv.config();

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// ROUTES
app.use('/users', Users);
app.use('/auth', Auth);

// INITIALIZE SERVER
StartServer(app, 3001);
