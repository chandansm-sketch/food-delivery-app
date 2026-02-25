import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
    const { restaurant, items, total, paymentMethod, deliveryAddress } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    try {
        const order = new Order({
            customer: req.user._id,
            restaurant,
            items,
            total,
            paymentMethod,
            deliveryAddress: deliveryAddress || 'Connaught Place, New Delhi'
        });
        const createdOrder = await order.save();
        await createdOrder.populate('restaurant', 'name address');
        await createdOrder.populate('customer', 'name phone');
        req.app.get('socketio').emit('new_order', createdOrder);
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in customer orders
// @route   GET /api/orders/myorders
// @access  Private/Customer
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id }).populate('restaurant', 'name');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get owner's restaurant orders
// @route   GET /api/orders/owner
// @access  Private/Owner
export const getOwnerOrders = async (req, res) => {
    try {
        // Find all restaurants owned by this user
        const restaurants = await Restaurant.find({ owner: req.user._id });
        if (!restaurants.length) return res.status(404).json({ message: 'Restaurants not found' });

        const restaurantIds = restaurants.map(r => r._id);
        const orders = await Order.find({ restaurant: { $in: restaurantIds } }).populate('customer', 'name phone').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available orders for delivery wrapper
// @route   GET /api/orders/delivery/available
// @access  Private/Delivery
export const getAvailableDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Ready for Pickup', deliveryPartner: { $exists: false } }).populate('restaurant', 'name address');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get delivery partner's assigned orders
// @route   GET /api/orders/delivery/my-deliveries
// @access  Private/Delivery
export const getMyDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({ deliveryPartner: req.user._id }).populate('restaurant', 'name address').populate('customer', 'name phone');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, deliveryPartnerId } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status) order.status = status;
        if (deliveryPartnerId && !order.deliveryPartner) {
            order.deliveryPartner = deliveryPartnerId; // Assign delivery partner
        }

        const updatedOrder = await order.save();
        await updatedOrder.populate('restaurant', 'name address');
        await updatedOrder.populate('customer', 'name phone');
        req.app.get('socketio').emit('order_status_updated', updatedOrder);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
