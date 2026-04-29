var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var TierListSchema = new Schema({
    Name: {
        type: String,
        required: '{PATH} is required!'
    },
    GameId: {
        type: ObjectId,
        required: '{PATH} is required!',
        ref: 'Games'
    },
    OwnerId: {
        type: ObjectId,
        required: '{PATH} is required!',
        ref: 'Accounts'
    },
    Source: {
        type: String,
        required: false
    },
    Tiers: [{
        Name: String,
        Color: String,
        Characters: [{
            type: ObjectId,
            ref: 'Characters'
        }]
    }],
    Views: {
        type: Number,
        default: 0
    },
    Likes: [{
        type: ObjectId,
        ref: 'Accounts'
    }]
}, {
    timestamps: true,
});

var TierLists = mongoose.model("TierLists", TierListSchema);

module.exports = TierLists;
