'use strict';

import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import { EmitHandler } from './app/EmitHandler.js';

const App = express();

App.use(bodyParser.json())
App.use(cors());
App.use(logger('dev'));
App.use(cookieParser());
App.use(errorHandler({ dumpExceptions: true, showStack: true }));

App.use('/api/socket', EmitHandler);

export default App;
