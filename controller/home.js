
// Import required models
const Players = require("../models/players");
const Games = require("../models/games");
const Matches = require("../models/matches");
const Tournaments = require("../models/tournaments");

// Fetch counts for all main entities
async function getCounts(req, res) {
  try {
    // Get counts for each model
    const [playersCount, gamesCount, matchesCount, tournamentsCount] = await Promise.all([
      Players.countDocuments(),
      Games.countDocuments(),
      Matches.countDocuments(),
      Tournaments.countDocuments()
    ]);

    // Return structured response
    res.json({
      success: true,
      data: {
        players: playersCount,
        games: gamesCount,
        matches: matchesCount,
        tournaments: tournamentsCount
      }
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching counts",
      error: error.message
    });
  }
}

module.exports = { getCounts }