var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    Title: {
      type: String,
      required: '{PATH} is required!'
    },
    FeaturedImage: {
      type: String,
    },
    Content: {
      type: String,
      required: '{PATH} is required!'
    },

  }, {
    timestamps: true, 
  });

var Articles = mongoose.model("Articles", ArticleSchema);

module.exports = Articles; 

