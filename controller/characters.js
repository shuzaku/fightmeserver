var Character = require("../models/characters");
var ObjectId = require("mongodb").ObjectId;

var CHARACTER_LIST_FIELDS =
  "Name GameId ImageUrl AvatarUrl Slug Archetype Gameplan Strengths Weakness releaseDate OverviewUrl Wiki createdAt updatedAt";

function buildSlugFromName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseDate(val) {
  if (val == null || val === "") return undefined;
  var d = new Date(val);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

// Add new character(s)
function addCharacter(req, res) {
  if (!req.query.bulk) {
    var Name = req.body.Name;
    var GameId = req.body.GameId;
    var Slug = (req.body.Slug && String(req.body.Slug).trim()) || buildSlugFromName(Name);

    var new_character = new Character({
      Name: Name,
      GameId: GameId,
      ImageUrl: req.body.ImageUrl,
      AvatarUrl: req.body.AvatarUrl,
      Slug: Slug || undefined,
      Archetype: optionalTrimmed(req.body.Archetype),
      Gameplan: optionalTrimmed(req.body.Gameplan),
      Strengths: optionalTrimmed(req.body.Strengths),
      Weakness: optionalTrimmed(req.body.Weakness),
      releaseDate: parseDate(req.body.releaseDate),
      OverviewUrl: optionalTrimmed(req.body.OverviewUrl),
      Wiki: optionalTrimmed(req.body.Wiki),
    });

    new_character.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(400).send({ success: false, message: error.message || "Save failed" });
      }
      res.send({
        success: true,
        message: "Character saved successfully!",
      });
    });
  } else {
    Character.insertMany(req.body, function (error) {
      if (error) {
        console.log(error);
        return res.status(400).send({ success: false, message: error.message || "Bulk insert failed" });
      }
      res.send({
        success: true,
        message: "Characters saved successfully!",
      });
    });
  }
}

function optionalTrimmed(v) {
  if (v == null) return undefined;
  var s = String(v).trim();
  return s || undefined;
}

// Query Characters
function queryCharacter(req, res) {
  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var queries = [];

  for (var i = 0; i < names.length; i++) {
    var query = {};
    if (names[i] === "Id") {
      query = { _id: ObjectId(values[i]) };
      queries.push(query);
    } else {
      query[names[i]] = values[i];
      queries.push(query);
    }
  }

  if (queries.length > 1) {
    Character.find(
      { $or: queries },
      CHARACTER_LIST_FIELDS,
      function (error, characters) {
        if (error) {
          console.error(error);
        }
        res.send({
          characters: characters,
        });
      }
    ).sort({ Name: 1 });
  } else {
    Character.find(queries[0], CHARACTER_LIST_FIELDS, function (error, characters) {
      if (error) {
        console.error(error);
      }

      res.send({
        characters: characters,
      });
    }).sort({ Name: 1 });
  }
}

// Fetch all characters
function getCharacters(req, res) {
  Character.find({}, CHARACTER_LIST_FIELDS, function (error, characters) {
    if (error) {
      console.error(error);
    }
    res.send({
      characters: characters,
    });
  }).sort({ _id: -1 });
}

// Fetch single character
function getCharacter(req, res) {
  Character.findById(req.params.id, function (error, c) {
    if (error) {
      console.error(error);
    }
    res.send({
      characters: c ? [c] : [],
    });
  });
}

// Fetch single character by Slug
function getCharacterBySlug(req, res) {
  Character.find({ Slug: req.params.slug }, function (error, characters) {
    if (error) {
      console.error(error);
    }
    res.send({
      characters: characters,
    });
  });
}

// Update a character
function updateCharacter(req, res) {
  Character.findById(req.params.id, function (error, character) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false });
    }
    if (!character) {
      return res.status(404).send({ success: false, message: "Not found" });
    }
    if (req.body.Name !== undefined) character.Name = req.body.Name;
    if (req.body.GameId !== undefined) character.GameId = req.body.GameId;
    if (req.body.ImageUrl !== undefined) character.ImageUrl = req.body.ImageUrl;
    if (req.body.AvatarUrl !== undefined) {
      character.AvatarUrl = req.body.AvatarUrl;
    }
    if (req.body.Slug !== undefined) {
      var s = (req.body.Slug && String(req.body.Slug).trim()) || buildSlugFromName(req.body.Name);
      character.Slug = s || undefined;
    }
    if (req.body.Archetype !== undefined) {
      character.Archetype = optionalTrimmed(req.body.Archetype);
    }
    if (req.body.Gameplan !== undefined) {
      character.Gameplan = optionalTrimmed(req.body.Gameplan);
    }
    if (req.body.Strengths !== undefined) {
      character.Strengths = optionalTrimmed(req.body.Strengths);
    }
    if (req.body.Weakness !== undefined) {
      character.Weakness = optionalTrimmed(req.body.Weakness);
    }
    if (req.body.releaseDate !== undefined) {
      var rd = parseDate(req.body.releaseDate);
      character.releaseDate = rd;
    }
    if (req.body.OverviewUrl !== undefined) {
      character.OverviewUrl = optionalTrimmed(req.body.OverviewUrl);
    }
    if (req.body.Wiki !== undefined) {
      character.Wiki = optionalTrimmed(req.body.Wiki);
    }
    character.save(function (error) {
      if (error) {
        console.log(error);
        return res.status(400).send({ success: false, message: error.message || "Update failed" });
      }
      res.send({
        success: true,
      });
    });
  });
}

// Delete a character
function deleteCharacter(req, res) {
  Character.remove(
    {
      _id: req.params.id,
    },
    function (err, character) {
      if (err) return res.send(err);
      res.send({
        success: true,
      });
    }
  );
}

// Query matchup info
function getMatchupInfo(req, res) {
  var queries = [];

  var character1 = ObjectId(req.query.character1);
  var character2 = ObjectId(req.query.character2);

  queries.push({ _id: character1 });
  queries.push({ _id: character2 });

  Character.find(
    { $or: queries },
    "Name ImageUrl AvatarUrl GameId Slug " +
      "Archetype Gameplan Strengths Weakness releaseDate OverviewUrl Wiki",
    function (error, characters) {
      if (error) {
        console.error(error);
      }
      res.send({
        characters: characters,
      });
    }
  );
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
