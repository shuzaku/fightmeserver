var Event = require("../models/events");
var ObjectId = require('mongodb').ObjectId;

// Add new event
function addEvent(req, res) {
  var Name = req.body.Name;
  var Url = req.body.Url;
  var Date = req.body.Date;
  var Type = req.body.Type;
  var ImageUrl = req.body.ImageUrl;

  var new_event = new Event({
    Name: Name,
    Url: Url,
    Date: Date,
    Type: Type,
    ImageUrl: ImageUrl
  })

  new_event.save(function (error, event) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!',
      id: event.id
    })
  })
};

// Fetch all events
function getEvents(req, res) {
  Event.find({}, 'Name Url Date Type ImageUrl', function (error, events) {
    if (error) { console.error(error); }
    res.send({
      events: events
    })
  }).sort({ _id: -1 })
}

// Fetch single event
function getEvent(req, res) {
  Event.findById(req.params.id, 'Name Url Date Type ImageUrl', function (error, event) {
    if (error) { console.error(error); }
    res.send(event)
  })
}

// Update a event
function updateEvent(req, res) {
  var db = req.db;
  Event.findById(req.params.id, 'Name Url Date Type ImageUrl', function (error, event) {
    if (error) { console.error(error); }

    event.Name = req.body.Name;
    event.Url = req.body.Url;
    event.Type = req.body.Type;
    event.ImageUrl = req.body.ImageUrl;
    event.Date = req.body.Date;

    event.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a event
function deleteEvent(req, res) {
  Event.remove({
    _id: req.params.id
  }, function (err, event) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

module.exports = { addEvent, getEvents, getEvent, updateEvent, deleteEvent}