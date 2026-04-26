
var Account = require("../models/accounts");
var ObjectId = require('mongodb').ObjectId;
const nodemailer = require("nodemailer");
let dotenv = require('dotenv');
var playerAccountLink = require("../service/player-account-link-service");
dotenv.config();

// Add new Account
function addAccount(req, res) {
  var DisplayName = req.body.DisplayName;
  var Email = req.body.Email
  var IsEmailVerified = req.body.IsEmailVerified;
  var AccountType = req.body.AccountType;
  var Uid = req.body.Uid;

  var new_account = new Account({
    DisplayName: DisplayName,
    Email: Email,
    IsEmailVerified: IsEmailVerified,
    AccountType: AccountType,
    Uid: Uid,
    FavoriteVideos: [],
    FollowedPlayers: [],
    FollowedCharacters: [],
    Collections: []  
  })

  new_account.save(function (error) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Account saved successfully!'
    })
    sendAdminNotification(new_account);
  })

};

async function sendAdminNotification(account){
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME, // generated ethereal user
      pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: '"Fighters Edge Accounts', // sender address
    to: "mtchau@fighters-edge.com", // list of receivers
    subject: `${account.DisplayName} : New account signup`, // Subject line
    text: `${account.DisplayName} signed up with email ${account.Email}`, // plain text body
    html: `${account.DisplayName} signed up with email ${account.Email}`, // html body
  });
}

// Fetch single account
function getAccount(req, res) {
  var db = req.db;
  Account.aggregate([
    {$match:  { Uid: req.params.id }  },
    {$lookup:  
      {
        from: 'players',
        localField: 'FollowedPlayers.PlayerId',
        foreignField: '_id',
        as: 'FollowedPlayersDetails'
      }
    },
    {$lookup:  
      {
        from: 'characters',
        localField: 'FollowedCharacters.CharacterId',
        foreignField: '_id',
        as: 'FollowedCharactersDetails'
      }
    },
    {$lookup:  
      {
        from: 'games',
        localField: 'FollowedGames.GameId',
        foreignField: '_id',
        as: 'FollowedGamesDetails'
      }
    },
    {$lookup:  
      {
        from: 'collections',
        localField: 'Collections',
        foreignField: '_id',
        as: 'Collections'
      }
    }
  ], function (error, account) {
    if (error) { console.error(error); }
    if (Array.isArray(account) && account.length) {
      for (var k = 0; k < account.length; k += 1) {
        var merged = playerAccountLink.mergedPlayerIdsForAccount(account[k]);
        account[k].LinkedPlayerIds = merged;
      }
    }
    res.send({
      account: account
    })
  })

}


function sameIdArraysForLinked(accountDoc, incoming) {
  var a = playerAccountLink.mergedPlayerIdsForAccount(accountDoc);
  a = a.map(String).sort().join(',');
  var b = (Array.isArray(incoming) ? incoming : [])
    .map(function (x) {
      if (x && x._id) { return String(x._id); }
      return String(x);
    })
    .filter(function (s) { return s && s !== 'undefined' && s !== 'null'; })
    .map(String)
    .sort()
    .join(',');
  return a === b;
}

function applyBodyToAccount(account, b) {
  if (b.FavoriteVideos !== undefined) {
    account.FavoriteVideos = b.FavoriteVideos;
  }
  if (b.FollowedPlayers && Array.isArray(b.FollowedPlayers)) {
    account.FollowedPlayers = b.FollowedPlayers.map(function (player) {
      return {
        'PlayerId' : ObjectId(player.PlayerId),
        'AddedDate': player.AddedDate
      };
    });
  }
  if (b.FollowedCharacters && Array.isArray(b.FollowedCharacters)) {
    account.FollowedCharacters = b.FollowedCharacters.map(function (character) {      
      return {
        'CharacterId' : ObjectId(character.CharacterId),
        'AddedDate': character.AddedDate
      };
    });
  }
  if (b.FollowedGames && Array.isArray(b.FollowedGames)) {
    account.FollowedGames = b.FollowedGames.map(function (game) {      
      return {
        'GameId' : ObjectId(game.GameId),
        'AddedDate': game.AddedDate
      };
    });
  }
  if (b.Collections && Array.isArray(b.Collections)) {
    account.Collections = b.Collections.map(function (collection) { return ObjectId(collection); });
  }
}

function saveAccountWithBody(req, res) {
  Account.findById(req.params.id, function (error, account) {
    if (error) {
      console.error(error);
      return res.status(500).send({ message: 'Database error' });
    }
    if (!account) {
      return res.status(404).send({ message: 'Account not found' });
    }
    applyBodyToAccount(account, req.body);
    return account.save(function (err) {
      if (err) {
        console.log(err);
        return res.status(500).send({ success: false });
      }
      return res.send({
        success: true
      });
    });
  });
}

function patchAccount(req, res) {
  if (Object.prototype.hasOwnProperty.call(req.body, 'LinkedPlayerIds')) {
    return Account.findById(req.params.id, function (e0, existing) {
      if (e0) {
        return res.status(500).send({ message: e0.message || 'Database error' });
      }
      if (!existing) {
        return res.status(404).send({ message: 'Account not found' });
      }
      if (sameIdArraysForLinked(existing, req.body.LinkedPlayerIds)) {
        applyBodyToAccount(existing, req.body);
        return existing.save(function (e1) {
          if (e1) {
            return res.status(500).send({ success: false });
          }
          return res.send({ success: true });
        });
      }
      return playerAccountLink.reconcileAccountLinkedPlayerIds(
        String(req.params.id),
        req.body.LinkedPlayerIds,
        function (eLink) {
          if (eLink) {
            return res.status(400).send({ message: eLink.message || 'Link update failed' });
          }
          return Account.findById(req.params.id, function (e2, account) {
            if (e2) {
              return res.status(500).send({ message: e2.message });
            }
            if (!account) {
              return res.status(404).send({ message: 'Account not found' });
            }
            applyBodyToAccount(account, req.body);
            return account.save(function (e3) {
              if (e3) {
                return res.status(500).send({ success: false });
              }
              return res.send({ success: true });
            });
          });
        }
      );
    });
  }
  return saveAccountWithBody(req, res);
}
module.exports = { addAccount, getAccount, patchAccount, sendAdminNotification }