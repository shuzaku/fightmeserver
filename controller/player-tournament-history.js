var playerTournamentHistoryService = require("../service/player-tournament-history-service");

// GET /players/:playerId/tournament-history?page=1&limit=10&year=2025&gameId=...
function getPlayerTournamentHistory(req, res) {
    playerTournamentHistoryService.getPlayerTournamentHistory(req.params.playerId, {
        page: req.query.page,
        limit: req.query.limit,
        year: req.query.year,
        gameId: req.query.gameId,
    })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player tournament history',
                error: error.message
            });
        });
}

module.exports = { getPlayerTournamentHistory };
