var seasonPowerRankingsService = require("../service/season-power-rankings-service");

// GET /season-power-rankings?gameId=...&season=2026&limit=50&page=1
function getSeasonLeaderboard(req, res) {
    seasonPowerRankingsService.getSeasonLeaderboard(req.query.gameId, req.query.season, {
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
                message: 'Error fetching season power rankings',
                error: error.message
            });
        });
}

// GET /season-power-rankings/seasons?gameId=...
function getAvailableSeasons(req, res) {
    seasonPowerRankingsService.getAvailableSeasons(req.query.gameId)
        .then(seasons => {
            res.send({ seasons: seasons });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching available seasons',
                error: error.message
            });
        });
}

// GET /season-power-rankings/player/:playerId?gameId=...&season=2026
function getPlayerSeasonRanking(req, res) {
    seasonPowerRankingsService.getPlayerSeasonRanking(req.params.playerId, req.query.gameId, req.query.season)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player season ranking',
                error: error.message
            });
        });
}

module.exports = { getSeasonLeaderboard, getAvailableSeasons, getPlayerSeasonRanking };
