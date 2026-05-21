import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicket } from '../controllers/supportController.js';
import { protect } from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = express.Router();

// User routes
router.post('/tickets', protect, createTicket);           // FR45 — Submit ticket
router.get('/tickets', protect, getMyTickets);            // FR45 — View own tickets

// Admin routes
router.get('/admin/tickets', protect, roleCheck('admin'), getAllTickets);          // FR45 — Admin queue
router.put('/admin/tickets/:id', protect, roleCheck('admin'), updateTicket);      // FR45 — Resolve ticket

export default router;
