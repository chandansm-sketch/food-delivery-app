import express from 'express';
import { protect, ownerOnly, deliveryOnly } from '../middleware/authMiddleware.js';
import {
    createOrder,
    getMyOrders,
    getOwnerOrders,
    getAvailableDeliveries,
    getMyDeliveries,
    updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/owner', protect, ownerOnly, getOwnerOrders);
router.get('/delivery/available', protect, deliveryOnly, getAvailableDeliveries);
router.get('/delivery/my-deliveries', protect, deliveryOnly, getMyDeliveries);
router.put('/:id/status', protect, updateOrderStatus);

export default router;
