var comboService = require("../service/combos-service");

// Add new Combo
function addCombo(req, res) {
  comboService.addCombo(req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

// Update a combo
function patchCombo(req, res) {
  comboService.patchCombo(req.params.id, req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

// Delete a combo
function deleteCombo(req, res) {
  comboService.deleteCombo(req.params.id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

module.exports = { addCombo, patchCombo, deleteCombo }