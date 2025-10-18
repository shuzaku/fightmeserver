var gameService = require("../service/games-service");

// Add new game
function addGame(req, res) {
    gameService.addGame(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            // Check if it's a duplicate title error
            if (error.success === false && error.message.includes('already exists')) {
                res.status(409).send(error); // 409 Conflict
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Error saving game',
                    error: error.message
                });
            }
        });
} 

// Fetch all games
function getGames(req, res) {
    gameService.getGames()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching games',
                error: error.message
            });
        });
};

// Fetch single game
function getGame(req, res) {
    gameService.getGame(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching game',
                error: error.message
            });
        });
}

// Query Games
function queryGame(req, res) {
    gameService.queryGame(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error querying games',
                error: error.message
            });
        });
}

// Update a game
function updateGame(req, res) {
    gameService.updateGame(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating game',
                error: error.message
            });
        });
}

// Delete a game
function deleteGame(req, res) {
    gameService.deleteGame(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting game',
                error: error.message
            });
        });
}

module.exports = { addGame, getGames, getGame, queryGame, updateGame, deleteGame}