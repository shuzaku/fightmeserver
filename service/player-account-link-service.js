var Account = require('../models/accounts');
var Player = require('../models/players');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

function isObjectIdString(id) {
  return id && ObjectId.isValid(String(id)) && String(new ObjectId(String(id))) === String(id);
}

/** Merge array field + legacy single into string ids. */
function mergedPlayerIdsForAccount(doc) {
  if (!doc) {
    return [];
  }
  var out = [];
  if (Array.isArray(doc.LinkedPlayerIds)) {
    for (var i = 0; i < doc.LinkedPlayerIds.length; i += 1) {
      out.push(String(doc.LinkedPlayerIds[i]));
    }
  }
  if (doc.LinkedPlayerId) {
    out.push(String(doc.LinkedPlayerId));
  }
  var u = [];
  for (var j = 0; j < out.length; j += 1) {
    if (u.indexOf(out[j]) < 0) {
      u.push(out[j]);
    }
  }
  return u;
}

/**
 * @param {string} playerId
 * @param {string} accountId
 */
function linkPlayerToAccountWithDocs(player, account, done) {
  var pOid = player._id;
  if (player.AccountId && !player.AccountId.equals(account._id)) {
    return Account.findById(player.AccountId, function (eOld, oldAcc) {
      if (eOld) {
        return done(eOld);
      }
      if (oldAcc) {
        if (oldAcc.LinkedPlayerIds) {
          oldAcc.LinkedPlayerIds.pull(pOid);
        }
        oldAcc.set('LinkedPlayerId', null);
        return oldAcc.save(function (eS) {
          if (eS) {
            return done(eS);
          }
          return applyAddPlayerToAccount(player, account, done);
        });
      }
      return applyAddPlayerToAccount(player, account, done);
    });
  }
  return applyAddPlayerToAccount(player, account, done);
}

/**
 * @param {import('mongoose').Document} player
 * @param {import('mongoose').Document} account
 */
function applyAddPlayerToAccount(player, account, done) {
  var pOid = player._id;
  var aOid = account._id;
  if (!account.LinkedPlayerIds) {
    account.LinkedPlayerIds = [];
  }
  if (!account.LinkedPlayerIds.some(function (x) { return x.equals(pOid); })) {
    account.LinkedPlayerIds.push(pOid);
  }
  account.set('LinkedPlayerId', null);
  player.set('AccountId', aOid);
  return account.save(function (e1) {
    if (e1) {
      return done(e1);
    }
    return player.save(function (e2) {
      done(e2);
    });
  });
}

/**
 * @param {string} playerId
 * @param {string|null|undefined} accountId  use null, '', or "null" to unlink
 * @param {function} done (err) =>
 */
function setLinkByPlayerId(playerId, accountId, done) {
  if (!isObjectIdString(playerId)) {
    return done(new Error('Invalid player id'));
  }
  if (accountId === null || accountId === '' || (typeof accountId === 'string' && accountId.toLowerCase() === 'null')) {
    return Player.findById(new ObjectId(String(playerId)), function (e2, player) {
      if (e2) {
        return done(e2);
      }
      if (!player) {
        return done(new Error('Player not found'));
      }
      return clearPlayerLink(player, done);
    });
  }
  if (!isObjectIdString(accountId)) {
    return done(new Error('Invalid account id'));
  }
  const pOid = new ObjectId(String(playerId));
  const aOid = new ObjectId(String(accountId));
  return Player.findById(pOid, function (err, player) {
    if (err) {
      return done(err);
    }
    if (!player) {
      return done(new Error('Player not found'));
    }
    return Account.findById(aOid, function (e2, account) {
      if (e2) {
        return done(e2);
      }
      if (!account) {
        return done(new Error('Account not found'));
      }
      return linkPlayerToAccountWithDocs(player, account, done);
    });
  });
}

/**
 * @param {import('mongoose').Document} player
 */
function clearPlayerLink(player, done) {
  if (!player) {
    return done(new Error('Player not found'));
  }
  if (!player.AccountId) {
    return done();
  }
  var aid = player.AccountId;
  Account.findById(aid, function (err, acc) {
    if (err) {
      return done(err);
    }
    player.set('AccountId', null);
    if (acc) {
      if (acc.LinkedPlayerIds) {
        acc.LinkedPlayerIds.pull(player._id);
      }
      acc.set('LinkedPlayerId', null);
      return acc.save(function (e2) {
        if (e2) {
          return done(e2);
        }
        return player.save(done);
      });
    }
    return player.save(done);
  });
}

/**
 * @param {string} accountMongoId
 * @param {string[]|null} desiredIds
 * @param {function} done
 */
function reconcileAccountLinkedPlayerIds(accountMongoId, desiredIds, done) {
  if (!isObjectIdString(accountMongoId)) {
    return done(new Error('Invalid account id'));
  }
  if (!Array.isArray(desiredIds)) {
    return done(new Error('LinkedPlayerIds must be an array'));
  }
  return Account.findById(new ObjectId(String(accountMongoId)), function (e, account) {
    if (e) {
      return done(e);
    }
    if (!account) {
      return done(new Error('Account not found'));
    }
    var want = desiredIds
      .map(function (x) { return String(x); })
      .filter(function (s) { return s && s !== 'null' && s !== 'undefined' && isObjectIdString(s); });
    var current = mergedPlayerIdsForAccount(account);
    var toAdd = want.filter(function (p) { return current.indexOf(p) < 0; });
    var toRemove = current.filter(function (p) { return want.indexOf(p) < 0; });

    function doRemove(i) {
      if (i >= toRemove.length) {
        return doAdd(0);
      }
      return setLinkByPlayerId(toRemove[i], null, function (er) {
        if (er) {
          return done(er);
        }
        return doRemove(i + 1);
      });
    }

    function doAdd(i) {
      if (i >= toAdd.length) {
        return done();
      }
      return setLinkByPlayerId(toAdd[i], String(accountMongoId), function (er) {
        if (er) {
          return done(er);
        }
        return doAdd(i + 1);
      });
    }

    return doRemove(0);
  });
}

/**
 * @param {mongoose.Types.ObjectId} aOid
 */
function unlinkAccountCompletely(aOid, done) {
  return reconcileAccountLinkedPlayerIds(String(aOid), [], done);
}

/**
 * @param {string|null|undefined} linkedPlayerId
 * @param {string} accountMongoId
 */
function setLinkByAccountId(linkedPlayerId, accountMongoId, done) {
  if (!isObjectIdString(accountMongoId)) {
    return done(new Error('Invalid account id'));
  }
  if (linkedPlayerId === null || linkedPlayerId === '' || (typeof linkedPlayerId === 'string' && linkedPlayerId.toLowerCase() === 'null')) {
    return unlinkAccountCompletely(new ObjectId(String(accountMongoId)), done);
  }
  if (!isObjectIdString(linkedPlayerId)) {
    return done(new Error('Invalid player id'));
  }
  return setLinkByPlayerId(String(linkedPlayerId), String(accountMongoId), done);
}

module.exports = {
  setLinkByPlayerId: setLinkByPlayerId,
  setLinkByAccountId: setLinkByAccountId,
  reconcileAccountLinkedPlayerIds: reconcileAccountLinkedPlayerIds,
  mergedPlayerIdsForAccount: mergedPlayerIdsForAccount,
};
