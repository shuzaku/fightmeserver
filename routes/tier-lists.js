const express = require('express');
const router = express.Router();
const TierLists = require('../models/tier-lists');

// Create a new tier list
router.post('/tier-lists', async (req, res) => {
    try {
        const tierList = new TierLists(req.body);
        await tierList.save();
        res.send(tierList);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get all tier lists
router.get('/tier-lists', async (req, res) => {
    try {
        const tierLists = await TierLists.find({})
            .populate('GameId')
            .populate({
                path: 'Tiers.Characters',
                model: 'Characters'
            })
            .populate('OwnerId', 'DisplayName');
        res.send(tierLists);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a specific tier list by ID
router.get('/tier-lists/:id', async (req, res) => {
    try {
        const tierList = await TierLists.findById(req.params.id);
        if (!tierList) {
            return res.status(404).send();
        }
        res.send(tierList);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Increment view count
router.post('/tier-lists/:id/view', async (req, res) => {
    try {
        const tierList = await TierLists.findById(req.params.id);
        if (!tierList) {
            return res.status(404).send();
        }
        tierList.Views += 1;
        await tierList.save();
        res.send(tierList);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Toggle like
router.post('/tier-lists/:id/like', async (req, res) => {
    try {
        const tierList = await TierLists.findById(req.params.id);
        if (!tierList) {
            return res.status(404).send();
        }

        const userId = req.body.userId;
        const index = tierList.Likes.indexOf(userId);

        if (index === -1) {
            tierList.Likes.push(userId);
        } else {
            tierList.Likes.splice(index, 1);
        }

        await tierList.save();
        res.send(tierList);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
