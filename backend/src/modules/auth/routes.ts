import { Router } from 'express';
import { getAuthDetails, login, register } from './auth.controller.js';

const router = Router();

router.get('/credentials', getAuthDetails);
router.get('/details', getAuthDetails);
router.post('/login', login);
router.post('/register', register);

export { router as authRouter };
