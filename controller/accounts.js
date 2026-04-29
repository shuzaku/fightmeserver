var accountService = require("../service/accounts-service");
const nodemailer = require("nodemailer");
let dotenv = require('dotenv');
dotenv.config();

// Add new Account
function addAccount(req, res) {
    accountService.addAccount(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving account',
                error: error.message
            });
        });
};

async function sendAdminNotification(account) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: '"Fighters Edge Accounts"',
    to: "mtchau@fighters-edge.com",
    subject: `${account.DisplayName} : New account signup`,
    text: `${account.DisplayName} signed up with email ${account.Email}`,
    html: `${account.DisplayName} signed up with email ${account.Email}`,
  });
}

// Fetch single account
function getAccount(req, res) {
    accountService.getAccount(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching account',
                error: error.message
            });
        });
}

function patchAccount(req, res) {
    accountService.patchAccount(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating account',
                error: error.message
            });
        });
}

module.exports = { addAccount, getAccount, patchAccount, sendAdminNotification }
