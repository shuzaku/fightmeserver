
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

// Fetch single game
function getAccount(req, res) {
  var db = req.db;
  // Account.findById(req.params.id, 'DisplayName Email AccountType FavoriteVideos Collections', function (error, account) {
  //   if (error) { console.error(error); }
  //   res.send(account)
  // })

  Account.aggregate([{ $match:  { Uid: req.params.id }  }], function (error, account) {
    if (error) { console.error(error); }
    res.send({
      account: account
    })
  })

}


function patchAccount(req, res) {
  Account.findById(req.params.id, 'FavoriteVideos, Collections', function (error, account) {
    if (error) { console.error(error); }

    account.FavoriteVideos = req.body.FavoriteVideos;
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