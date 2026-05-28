var characterService = require("../service/characters-service");

// Add new character(s)
function addCharacter(req, res) {
    const isBulk = req.query.bulk;
    const characterData = isBulk ? req.body : {
        Name: req.body.Name,
        GameId: req.body.GameId,
        ImageUrl: req.body.ImageUrl,
        AvatarUrl: req.body.AvatarUrl,
        Slug: req.body.Slug,
        Archetype: req.body.Archetype,
        Gameplan: req.body.Gameplan,
        Strengths: req.body.Strengths,
        Weakness: req.body.Weakness,
        OverviewUrl: req.body.OverviewUrl,
        Wiki: req.body.Wiki,
        releaseDate: req.body.releaseDate,
    };

    characterService.addCharacter(characterData, isBulk)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving character',
                error: error.message
            });
        });
};

// Query Characters
function queryCharacter(req, res) {
    characterService.queryCharacter(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error querying characters',
                error: error.message
            });
        });
};

// Fetch all characters
function getCharacters(req, res) {
    characterService.getCharacters(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching characters',
                error: error.message
            });
        });
};

// Fetch single character
function getCharacter(req, res) {
    characterService.getCharacter(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching character',
                error: error.message
            });
        });
}

// Fetch single character by slug
function getCharacterBySlug(req, res) {
    characterService.getCharacterBySlug(req.params.slug)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching character by slug',
                error: error.message
            });
        });
}

// Update a character
function updateCharacter(req, res) {
    characterService.updateCharacter(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating character',
                error: error.message
            });
        });
}

// Delete a character
function deleteCharacter(req, res) {
    characterService.deleteCharacter(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting character',
                error: error.message
            });
        });
}

// Query matchup info
function getMatchupInfo(req, res) {
    characterService.getMatchupInfo(req.query.character1, req.query.character2)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching matchup info',
                error: error.message
            });
        });
}

module.exports = {
  addCharacter,
  queryCharacter,
  getCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  getMatchupInfo,
  getCharacterBySlug,
};
