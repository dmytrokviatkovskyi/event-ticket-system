import express from 'express';
import { 
    getMainPage, 
    createEvent, 
    getEditPage, 
    updateEvent, 
    deleteEvent, 
    buyTicket 
} from '../controllers/eventController.js';

const router = express.Router();

router.get('/', getMainPage);
router.post('/events/create', createEvent);
router.get('/events/edit/:id', getEditPage);
router.post('/events/update/:id', updateEvent);
router.post('/events/delete/:id', deleteEvent);
router.post('/tickets/buy', buyTicket);

export default router;