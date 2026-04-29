const express = require('express');
const router = express.Router();
const eventController = require('../controller/events');

// Events routes
router.post('/events', eventController.addEvent);
router.get('/events', eventController.getEvents);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);

module.exports = router;
