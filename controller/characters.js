var Character = require("../models/characters");

// Add new character(s)
function addCharacter(req, res) {
    if(!req.query.bulk){
      var Name = req.body.Name;
      var GameId = req.body.GameId
      var ImageUrl = req.body.ImageUrl;
    
      var new_character = new Character({
        Name: Name,
        GameId: GameId,
        ImageUrl: ImageUrl,
      })
    
      new_character.save(function (error) {
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Character saved successfully!'
        })
      })
    }
    else {
      Character.insertMany(req.body, function(error){
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Characters saved successfully!'
        })      
      })
    }
  };
  
  // Query Characters
function queryCharacter(req, res) {
    var db = req.db;
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    var queries = [];
  
    for(var i = 0; i < names.length; i++){
      var query = {};
      query[names[i]] = values[i];
      queries.push(query);
    }
    
    if(queries.length > 1) {
      Character.find({ $or: queries }, 'Name ImageUrl', function (error, characters) {
        if (error) { console.error(error); }
        res.send({
          characters: characters
        })
      }).sort({ Name: 1 })    
    }
    else {
      Character.find(queries[0], 'Name ImageUrl', function (error, characters) {
        if (error) { console.error(error); }
        res.send({
          characters: characters
        })
      }).sort({ Name: 1 })    
    }
  };
  
  // Fetch all characters
function getCharacters(req, res) {
    Character.find({}, 'Name GameId ImageUrl ', function (error, characters) {
      if (error) { console.error(error); }
      res.send({
        characters: characters
      })
    }).sort({ _id: -1 })
  };
  
  // Fetch single character
function getCharacter(req, res) {
    var db = req.db;
    Character.findById(req.params.id, 'Name GameId ImageUrl', function (error, character) {
      if (error) { console.error(error); }
      res.send(character)
    })
  }

  // Update a character
function updateCharacter(req, res) {
    var db = req.db;
    Character.findById(req.params.id, 'Name GameId ImageUrl', function (error, character) {
      if (error) { console.error(error); }
      character.Name = req.body.Name;
      character.GameId = req.body.GameId
      character.ImageUrl = req.body.ImageUrl;
      character.save(function (error) {
        if (error) {
          console.log(error)
        }
        res.send({
          success: true
        })
      }) 
    })
  }

  // Delete a character
function deleteCharacter(req, res) {
    var db = req.db;
    Character.remove({
      _id: req.params.id
    }, function (err, character) {
      if (err)
        res.send(err)
      res.send({
        success: true
      })
    })
  }

module.exports = { addCharacter, queryCharacter, getCharacters, getCharacter, updateCharacter, deleteCharacter}