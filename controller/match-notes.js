var MatchNote = require("../models/match-notes");
var ObjectId = require('mongodb').ObjectId;

// Add new match note
function addMatchNote(req, res) {
  var MatchId = null;
  if (req.body.MatchId) {
    try {
      MatchId = ObjectId(req.body.MatchId);
    } catch (e) {
      return res.status(400).send({
        success: false,
        message: 'Invalid MatchId',
        error: e.message
      });
    }
  }
  var AuthorId = ObjectId(req.body.AuthorId);
  var Content = req.body.Content;
  var Heading = req.body.Heading || null;
  var Timestamp = req.body.Timestamp ? Number(req.body.Timestamp) : null;
  var GameId = req.body.GameId ? ObjectId(req.body.GameId) : null;
  var Tags = req.body.Tags || [];
  var VideoUrl = req.body.VideoUrl != null && String(req.body.VideoUrl).trim() !== ''
    ? String(req.body.VideoUrl).trim()
    : null;

  if (!MatchId && !VideoUrl) {
    return res.status(400).send({
      success: false,
      message: 'MatchId or VideoUrl is required'
    });
  }

  var newMatchNote = new MatchNote({
    MatchId: MatchId,
    VideoUrl: VideoUrl,
    AuthorId: AuthorId,
    Content: Content,
    Heading: Heading,
    Timestamp: Timestamp,
    GameId: GameId,
    Tags: Tags
  });

  newMatchNote.save(function (error, matchNote) {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Error saving match note',
        error: error
      });
    }
    res.send({
      success: true,
      message: 'Match note saved successfully!',
      matchNoteId: matchNote.id
    });
  });
}

// Query Match Notes
function queryMatchNotes(req, res) {
  var names = req.query.queryName ? req.query.queryName.split(",") : [];
  var values = req.query.queryValue
    ? req.query.queryValue.split(",").map(function (v) {
        try {
          return decodeURIComponent(v);
        } catch (e) {
          return v;
        }
      })
    : [];
  var queries = [];
  var aggregate = [];

  if (names.length > 0) {
    for (var i = 0; i < names.length; i++) {
      var query = {};
      if (names[i] === 'MatchId' || names[i] === 'AuthorId' || names[i] === 'GameId' || names[i] === 'ParentNoteId') {
        query[names[i]] = { '$eq': ObjectId(values[i]) };
      } else if (names[i] === 'Id') {
        query['_id'] = { '$eq': ObjectId(values[i]) };
      } else {
        query[names[i]] = { '$eq': values[i] };
      }
      queries.push(query);
    }
  }

  // Always filter out deleted notes unless explicitly requested
  var finalQuery = { $and: [...queries, { IsDeleted: false }] };

  if (queries.length > 0) {
    MatchNote.find(finalQuery)
      .populate('AuthorId', 'DisplayName')
      .populate('GameId', 'Title')
      .select('MatchId VideoUrl AuthorId Content Heading Timestamp Likes LikedBy IsPinned IsEdited IsDeleted DeletedAt ReportCount ReportedBy ParentNoteId ReplyCount Tags GameId CreatedAt UpdatedAt')
      .sort({ IsPinned: -1, Timestamp: 1, CreatedAt: -1 })
      .exec(function (error, matchNotes) {
        if (error) {
          console.error(error);
          return res.status(500).send({
            success: false,
            message: 'Error querying match notes',
            error: error
          });
        }
        res.send({
          matchNotes: matchNotes
        });
      });
  } else {
    MatchNote.find({ IsDeleted: false })
      .populate('AuthorId', 'DisplayName')
      .populate('GameId', 'Title')
      .select('MatchId VideoUrl AuthorId Content Heading Timestamp Likes LikedBy IsPinned IsEdited IsDeleted DeletedAt ReportCount ReportedBy ParentNoteId ReplyCount Tags GameId CreatedAt UpdatedAt')
      .sort({ IsPinned: -1, Timestamp: 1, CreatedAt: -1 })
      .exec(function (error, matchNotes) {
        if (error) {
          console.error(error);
          return res.status(500).send({
            success: false,
            message: 'Error querying match notes',
            error: error
          });
        }
        res.send({
          matchNotes: matchNotes
        });
      });
  }
}

// Fetch all match notes
function getMatchNotes(req, res) {
  MatchNote.find({ IsDeleted: false })
    .populate('AuthorId', 'DisplayName')
    .populate('GameId', 'Title')
    .select('MatchId VideoUrl AuthorId Content Heading Timestamp Likes LikedBy IsPinned IsEdited IsDeleted DeletedAt ReportCount ReportedBy ParentNoteId ReplyCount Tags GameId CreatedAt UpdatedAt')
    .sort({ IsPinned: -1, Timestamp: 1, CreatedAt: -1 })
    .exec(function (error, matchNotes) {
      if (error) {
        console.error(error);
        return res.status(500).send({
          success: false,
          message: 'Error fetching match notes',
          error: error
        });
      }
      res.send({
        matchNotes: matchNotes
      });
    });
}

// Fetch single match note
function getMatchNote(req, res) {
  MatchNote.findById(req.params.id)
    .populate('AuthorId', 'DisplayName')
    .populate('GameId', 'Title')
    .select('MatchId VideoUrl AuthorId Content Heading Timestamp Likes LikedBy IsPinned IsEdited IsDeleted DeletedAt ReportCount ReportedBy ParentNoteId ReplyCount Tags GameId CreatedAt UpdatedAt')
    .exec(function (error, matchNote) {
      if (error) {
        console.error(error);
        return res.status(500).send({
          success: false,
          message: 'Error fetching match note',
          error: error
        });
      }
      if (!matchNote) {
        return res.status(404).send({
          success: false,
          message: 'Match note not found'
        });
      }
      res.send(matchNote);
    });
}

// Update a match note
function updateMatchNote(req, res) {
  MatchNote.findById(req.params.id, function (error, matchNote) {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Error finding match note',
        error: error
      });
    }
    if (!matchNote) {
      return res.status(404).send({
        success: false,
        message: 'Match note not found'
      });
    }

    // Update fields
    if (req.body.Content !== undefined) {
      matchNote.Content = req.body.Content;
      matchNote.IsEdited = true;
    }
    if (req.body.Heading !== undefined) {
      matchNote.Heading = req.body.Heading;
    }
    if (req.body.Timestamp !== undefined) {
      matchNote.Timestamp = req.body.Timestamp ? Number(req.body.Timestamp) : null;
    }
    if (req.body.IsPinned !== undefined) {
      matchNote.IsPinned = req.body.IsPinned;
    }
    if (req.body.Tags !== undefined) {
      matchNote.Tags = req.body.Tags;
    }
    if (req.body.GameId !== undefined) {
      matchNote.GameId = req.body.GameId ? ObjectId(req.body.GameId) : null;
    }

    matchNote.UpdatedAt = new Date();

    matchNote.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(500).send({
          success: false,
          message: 'Error updating match note',
          error: error
        });
      }
      res.send({
        success: true,
        message: 'Match note updated successfully'
      });
    });
  });
}

// Like/Unlike a match note
function toggleLikeMatchNote(req, res) {
  var matchNoteId = ObjectId(req.params.id);
  var userId = ObjectId(req.body.UserId);

  MatchNote.findById(matchNoteId, function (error, matchNote) {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Error finding match note',
        error: error
      });
    }
    if (!matchNote) {
      return res.status(404).send({
        success: false,
        message: 'Match note not found'
      });
    }

    var likedIndex = matchNote.LikedBy.findIndex(function (id) {
      return id.toString() === userId.toString();
    });

    if (likedIndex === -1) {
      // User hasn't liked, add like
      matchNote.LikedBy.push(userId);
      matchNote.Likes = matchNote.Likes + 1;
    } else {
      // User has liked, remove like
      matchNote.LikedBy.splice(likedIndex, 1);
      matchNote.Likes = Math.max(0, matchNote.Likes - 1);
    }

    matchNote.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(500).send({
          success: false,
          message: 'Error updating like',
          error: error
        });
      }
      res.send({
        success: true,
        likes: matchNote.Likes,
        isLiked: likedIndex === -1
      });
    });
  });
}

// Report a match note
function reportMatchNote(req, res) {
  var matchNoteId = ObjectId(req.params.id);
  var userId = ObjectId(req.body.UserId);

  MatchNote.findById(matchNoteId, function (error, matchNote) {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Error finding match note',
        error: error
      });
    }
    if (!matchNote) {
      return res.status(404).send({
        success: false,
        message: 'Match note not found'
      });
    }

    var reportedIndex = matchNote.ReportedBy.findIndex(function (id) {
      return id.toString() === userId.toString();
    });

    if (reportedIndex === -1) {
      // User hasn't reported, add report
      matchNote.ReportedBy.push(userId);
      matchNote.ReportCount = matchNote.ReportCount + 1;
    }

    matchNote.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(500).send({
          success: false,
          message: 'Error updating report',
          error: error
        });
      }
      res.send({
        success: true,
        reportCount: matchNote.ReportCount
      });
    });
  });
}

// Delete a match note (soft delete)
function deleteMatchNote(req, res) {
  MatchNote.findById(req.params.id, function (error, matchNote) {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: 'Error finding match note',
        error: error
      });
    }
    if (!matchNote) {
      return res.status(404).send({
        success: false,
        message: 'Match note not found'
      });
    }

    matchNote.IsDeleted = true;
    matchNote.DeletedAt = new Date();

    matchNote.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(500).send({
          success: false,
          message: 'Error deleting match note',
          error: error
        });
      }
      res.send({
        success: true,
        message: 'Match note deleted successfully'
      });
    });
  });
}

module.exports = {
  addMatchNote,
  queryMatchNotes,
  getMatchNotes,
  getMatchNote,
  updateMatchNote,
  toggleLikeMatchNote,
  reportMatchNote,
  deleteMatchNote
};

