import { Router } from 'express';
import { databaseController } from './database.controller.js';

export const databaseRouter = Router();

databaseRouter.get('/status', databaseController.getStatus);
