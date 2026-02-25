import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import {
    getRestaurants,
    getOwnerProfile,
    updateProfile,
    getRestaurantById,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/my-profile', protect, ownerOnly, getOwnerProfile);
router.post('/profile', protect, ownerOnly, updateProfile);
router.get('/:id', getRestaurantById);

// Menu routes
router.post('/menu', protect, ownerOnly, addMenuItem);
router.put('/menu/:id', protect, ownerOnly, updateMenuItem);
router.delete('/menu/:id', protect, ownerOnly, deleteMenuItem);

export default router;
