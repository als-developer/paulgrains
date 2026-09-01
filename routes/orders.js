const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { listingId, quantity, shippingAddress, paymentMethod } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ message: 'Listing is not available' });
    }

    if (listing.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    const order = new Order({
      buyer: req.user.userId,
      seller: listing.seller,
      listing: listingId,
      grain: listing.grain,
      quantity: quantity,
      price: listing.price,
      totalAmount: listing.price * quantity,
      shippingAddress,
      paymentMethod
    });

    await order.save();

    // Update listing status and quantity
    listing.quantity -= quantity;
    if (listing.quantity === 0) {
      listing.status = 'sold';
    }
    await listing.save();

    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'seller', select: 'name email phone' },
      { path: 'grain', select: 'name category' }
    ]);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { buyer: req.user.userId },
        { seller: req.user.userId }
      ]
    })
    .populate('buyer', 'name email phone')
    .populate('seller', 'name email phone')
    .populate('grain', 'name category')
    .populate('listing', 'images location')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone address')
      .populate('seller', 'name email phone address')
      .populate('grain', 'name category')
      .populate('listing', 'images location description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer._id.toString() !== req.user.userId && 
        order.seller._id.toString() !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.seller.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});

module.exports = router;
