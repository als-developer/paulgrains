const express = require('express');
const router = express.Router();
const Grain = require('../models/Grain');
const auth = require('../middleware/auth');

// Get all grains
router.get('/', async (req, res) => {
  try {
    const grains = await Grain.find();
    res.json(grains);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grains', error: error.message });
  }
});

// Get single grain
router.get('/:id', async (req, res) => {
  try {
    const grain = await Grain.findById(req.params.id);
    if (!grain) {
      return res.status(404).json({ message: 'Grain not found' });
    }
    res.json(grain);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grain', error: error.message });
  }
});

// Create grain (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const grain = new Grain(req.body);
    await grain.save();
    res.status(201).json(grain);
  } catch (error) {
    res.status(500).json({ message: 'Error creating grain', error: error.message });
  }
});

// Update grain (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const grain = await Grain.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!grain) {
      return res.status(404).json({ message: 'Grain not found' });
    }
    res.json(grain);
  } catch (error) {
    res.status(500).json({ message: 'Error updating grain', error: error.message });
  }
});

module.exports = router;
