// /routes/hotels.routes.js
import express from 'express';
import { getHotels } from '../api/hotelsController.js';

const router = express.Router();

// Define rota GET /api/hoteis
router.get('/', getHotels);

export default router;
