var playerService = require("../service/players-service");

// Add new player
function addPlayer(req, res) {
    const isBulk = req.query.bulk;
    playerService.addPlayer(req.body, isBulk)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving player',
                error: error.message
            });
        });
}

// Fetch all players
function getPlayers(req, res) {
    playerService.getPlayers(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching players',
                error: error.message
            });
        });
}

// Fetch single player
function getPlayer(req, res) {
    playerService.getPlayer(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player',
                error: error.message
            });
        });
}

// Update a player
function updatePlayer(req, res) {
    playerService.updatePlayer(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating player',
                error: error.message
            });
        });
}

// Delete a player
function deletePlayer(req, res) {
    playerService.deletePlayer(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting player',
                error: error.message
            });
        });
}

// Query Player
function queryPlayer(req, res) {
    playerService.queryPlayer(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error querying players',
                error: error.message
            });
        });
};

function getPlayerBySlug(req, res) {
    playerService.getPlayerBySlug(req.params.slug)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player by slug',
                error: error.message
            });
        });
}

async function mergePlayers(req, res) {
    try {
        const result = await playerService.mergePlayers(req.params.player1Id, req.params.player2Id);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error merging players',
            error: error.message
        });
    }
}

module.exports = {
  addPlayer,
  getPlayer,
  getPlayers,
  updatePlayer,
  deletePlayer,
  queryPlayer,
  getPlayerBySlug,
  mergePlayers
}
