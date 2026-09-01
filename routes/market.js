const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Grain = require('../models/Grain');
const auth = require('../middleware/auth');

// Get all available listings
router.get('/listings', async (req, res) => {
  try {
    const { grain, minPrice, maxPrice, city, state } = req.query;
    const filter = { status: 'available' };

    if (grain) filter.grain = grain;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (city) filter['location.city'] = city;
    if (state) filter['location.state'] = state;

    const listings = await Listing.find(filter)
      .populate('seller', 'name email phone')
      .populate('grain', 'name category unit')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Get single listing
router.get('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email phone address')
      .populate('grain', 'name category unit description');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listing', error: error.message });
  }
});

// Create listing
router.post('/listings', auth, async (req, res) => {
  try {
    const listingData = {
      ...req.body,
      seller: req.user.userId
    };

    const listing = new Listing(listingData);
    await listing.save();
    
    await listing.populate('grain', 'name category unit');
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
});

// Update listing
router.put('/listings/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('grain', 'name category unit');

    res.json(updatedListing);
  } catch (error) {
    res.status(500).json({ message: 'Error updating listing', error: error.message });
  }
});

// Delete listing
router.delete('/listings/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting listing', error: error.message });
  }
});

// Get market stats
router.get('/stats', async (req, res) => {
  try {
    const totalListings = await Listing.countDocuments({ status: 'available' });
    const averagePrice = await Listing.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);
    
    const topGrains = await Listing.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$grain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'grains', localField: '_id', foreignField: '_id', as: 'grainInfo' } }
    ]);

    res.json({
      totalListings,
      averagePrice: averagePrice[0]?.avgPrice || 0,
      topGrains
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;
