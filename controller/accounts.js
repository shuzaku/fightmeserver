
var Account = require("../models/accounts");

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

module.exports = { addAccount }