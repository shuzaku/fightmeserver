
var Account = require("../models/accounts");
var ObjectId = require('mongodb').ObjectId;

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
  })
};

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
    res.send({
      account: account
    })
  })

}


function patchAccount(req, res) {
  Account.findById(req.params.id, 'FavoriteVideos, FollowedPlayers, FollowedCharacters, FollowedGames, Collections', function (error, account) {
    if (error) { console.error(error); }
    account.FavoriteVideos = req.body.FavoriteVideos;
    account.FollowedPlayers = req.body.FollowedPlayers.map(player => {
      return {
        'PlayerId' : ObjectId(player.PlayerId),
        'AddedDate': player.AddedDate
      }
    });
    account.FollowedCharacters = req.body.FollowedCharacters.map(character => {      
      return {
      'CharacterId' : ObjectId(character.CharacterId),
      'AddedDate': character.AddedDate
      }
    });
    account.FollowedGames = req.body.FollowedGames.map(game => {      
      return {
      'GameId' : ObjectId(game.GameId),
      'AddedDate': game.AddedDate
      }
    });

    account.Collections = req.body.Collections.map(collection => {return ObjectId(collection)});
    account.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}
module.exports = { addAccount, getAccount, patchAccount }