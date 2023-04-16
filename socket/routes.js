'use strict';

//Imports
import express from 'express';
import RouterOptions from '../config/RouterOptions';
import ProcessRoutes from './ProcessRoutes';

//Routes
import EmitterRoutes from './app';

//Procss socket router
let EmitterRouter = express.Router(RouterOptions);
if (EmitterRoutes && EmitterRoutes.length > 0) {
    EmitterRouter = ProcessRoutes(EmitterRouter, EmitterRoutes);
} else {
    console.error('There is no socket route configured')
}

//Exports
export { EmitterRouter };