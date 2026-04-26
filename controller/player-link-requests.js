var ObjectId = require("mongodb").ObjectId;
var PlayerLinkRequest = require("../models/player-link-requests");
var Player = require("../models/players");
var Account = require("../models/accounts");
var linkService = require("../service/player-account-link-service");

function toOid(id) {
  if (!id || !ObjectId.isValid(String(id))) {
    return null;
  }
  return new ObjectId(String(id));
}

function isValidOid(id) {
  return id && ObjectId.isValid(String(id));
}

// POST body: { AccountId, PlayerId } — user asks to link this player to their account
function createRequest(req, res) {
  var accountId = req.body && req.body.AccountId;
  var playerId = req.body && req.body.PlayerId;
  if (!isValidOid(accountId) || !isValidOid(playerId)) {
    return res.status(400).send({ message: "AccountId and PlayerId are required" });
  }
  return Player.findById(playerId, function (eP, player) {
    if (eP) {
      return res.status(500).send({ message: eP.message || "Error" });
    }
    if (!player) {
      return res.status(404).send({ message: "Player not found" });
    }
    if (player.AccountId) {
      return res.status(400).send({ message: "This player is already linked to an account" });
    }
    var aOid = toOid(accountId);
    var pOid = toOid(playerId);
    return Account.findById(aOid, function (eAcc, acc) {
      if (eAcc) {
        return res.status(500).send({ message: eAcc.message || "Error" });
      }
      if (!acc) {
        return res.status(404).send({ message: "Account not found" });
      }
      var merged = linkService.mergedPlayerIdsForAccount(acc);
      if (merged.indexOf(String(pOid)) >= 0) {
        return res
          .status(400)
          .send({ message: "This player is already linked to your account" });
      }
    return PlayerLinkRequest.findOne(
      { AccountId: aOid, PlayerId: pOid },
      function (e, existing) {
        if (e) {
          return res.status(500).send({ message: e.message || "Error" });
        }
        if (existing) {
          if (existing.Status === "pending") {
            return res.send({ request: existing, message: "A request is already pending" });
          }
          if (existing.Status === "rejected") {
            existing.Status = "pending";
            existing.RejectionNote = undefined;
            return existing.save(function (e2, saved) {
              if (e2) {
                return res.status(500).send({ message: e2.message || "Error" });
              }
              return res.send({ request: saved });
            });
          }
          if (existing.Status === "approved") {
            return res.status(400).send({ message: "This request was already approved" });
          }
        }
        return new PlayerLinkRequest({
          AccountId: aOid,
          PlayerId: pOid,
          Status: "pending",
        }).save(function (e3, created) {
          if (e3) {
            if (e3.code === 11000) {
              return res.status(409).send({ message: "Duplicate request" });
            }
            return res.status(500).send({ message: e3.message || "Error" });
          }
          return res.send({ request: created });
        });
      }
    );
    });
  });
}

// Query: ?accountId=&playerId= — return single request or { request: null }
function getByAccountAndPlayer(req, res) {
  var accountId = req.query.accountId;
  var playerId = req.query.playerId;
  if (!isValidOid(accountId) || !isValidOid(playerId)) {
    return res.status(400).send({ message: "accountId and playerId query params required" });
  }
  return PlayerLinkRequest.findOne({
    AccountId: toOid(accountId),
    PlayerId: toOid(playerId),
  }, function (e, doc) {
    if (e) {
      return res.status(500).send({ message: e.message || "Error" });
    }
    return res.send({ request: doc || null });
  });
}

// Query: ?status=pending — list for admin
function listPending(req, res) {
  if (String(req.query.status) !== "pending") {
    return res.status(400).send({ message: "Use status=pending" });
  }
  return PlayerLinkRequest.find({ Status: "pending" })
    .sort({ createdAt: 1 })
    .populate("AccountId", "DisplayName Email Uid")
    .populate("PlayerId", "Name Slug")
    .exec(function (e, list) {
      if (e) {
        return res.status(500).send({ message: e.message || "Error" });
      }
      return res.send({ requests: list || [] });
    });
}

// PUT /player-link-requests/:id/approve
function approveRequest(req, res) {
  return PlayerLinkRequest.findById(req.params.id, function (e, r) {
    if (e) {
      return res.status(500).send({ message: e.message || "Error" });
    }
    if (!r) {
      return res.status(404).send({ message: "Request not found" });
    }
    if (r.Status !== "pending") {
      return res.status(400).send({ message: "Request is not pending" });
    }
    return Player.findById(r.PlayerId, function (e2, player) {
      if (e2) {
        return res.status(500).send({ message: e2.message || "Error" });
      }
      if (!player) {
        r.Status = "rejected";
        r.RejectionNote = "Player was deleted";
        return r.save(function () {
          return res.status(400).send({ message: "Player not found" });
        });
      }
      if (player.AccountId) {
        r.Status = "rejected";
        r.RejectionNote = "Player is already linked";
        return r.save(function () {
          return res
            .status(400)
            .send({ message: "Player is now linked to another account; request closed" });
        });
      }
      return linkService.setLinkByPlayerId(
        String(r.PlayerId),
        String(r.AccountId),
        function (e3) {
          if (e3) {
            return res
              .status(400)
              .send({ message: e3.message || "Failed to create link" });
          }
          r.Status = "approved";
          r.RejectionNote = undefined;
          return r.save(function (e4, saved) {
            if (e4) {
              return res.status(500).send({ message: e4.message || "Error" });
            }
            return res.send({ success: true, request: saved });
          });
        }
      );
    });
  });
}

// PUT /player-link-requests/:id/reject  body: { RejectionNote? }
function rejectRequest(req, res) {
  return PlayerLinkRequest.findById(req.params.id, function (e, r) {
    if (e) {
      return res.status(500).send({ message: e.message || "Error" });
    }
    if (!r) {
      return res.status(404).send({ message: "Request not found" });
    }
    if (r.Status !== "pending") {
      return res.status(400).send({ message: "Request is not pending" });
    }
    r.Status = "rejected";
    r.RejectionNote = (req.body && req.body.RejectionNote) || "Rejected by admin";
    return r.save(function (e2, saved) {
      if (e2) {
        return res.status(500).send({ message: e2.message || "Error" });
      }
      return res.send({ success: true, request: saved });
    });
  });
}

// Only owner: AccountId in query must match
function cancelRequest(req, res) {
  var accountId = req.query.accountId;
  if (!isValidOid(accountId) || !isValidOid(req.params.id)) {
    return res.status(400).send({ message: "accountId query and valid id param required" });
  }
  return PlayerLinkRequest.findById(req.params.id, function (e, r) {
    if (e) {
      return res.status(500).send({ message: e.message || "Error" });
    }
    if (!r) {
      return res.status(404).send({ message: "Request not found" });
    }
    if (String(r.AccountId) !== String(toOid(accountId))) {
      return res.status(403).send({ message: "Not your request" });
    }
    if (r.Status !== "pending") {
      return res.status(400).send({ message: "Can only cancel a pending request" });
    }
    return PlayerLinkRequest.findByIdAndDelete(r._id, function (e2) {
      if (e2) {
        return res.status(500).send({ message: e2.message || "Error" });
      }
      return res.send({ success: true });
    });
  });
}

module.exports = {
  createRequest: createRequest,
  getByAccountAndPlayer: getByAccountAndPlayer,
  listPending: listPending,
  approveRequest: approveRequest,
  rejectRequest: rejectRequest,
  cancelRequest: cancelRequest,
};
