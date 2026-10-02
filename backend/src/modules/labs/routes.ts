import { Router } from 'express';
import { getDailySlots, bookSlot, releaseSlot } from './slot.controller.js';

const router = Router();

router.get('/daily-slots', getDailySlots);
router.post('/book-slot', bookSlot);
router.post('/release-slot', releaseSlot);

export { router as labRouter };
