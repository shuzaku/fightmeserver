var playerRatingsService = require("../service/player-ratings-service");

// GET /player-ratings?gameId=...&limit=50&page=1
function getLeaderboard(req, res) {
    playerRatingsService.getLeaderboard(req.query.gameId, {
        limit: req.query.limit,
        page: req.query.page,
    })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching leaderboard',
                error: error.message
            });
        });
}

// GET /player-ratings/player/:playerId?gameId=...
function getPlayerRating(req, res) {
    playerRatingsService.getPlayerRating(req.params.playerId, req.query.gameId)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player rating',
                error: error.message
            });
        });
}

module.exports = { getLeaderboard, getPlayerRating };
