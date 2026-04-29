var Combo = require("../models/combos");
var ComboClip = require("../models/combo-clips");
var ObjectId = require('mongodb').ObjectId;

// Add new Combo
function addCombo(comboData, isBulk = false) {
    return new Promise((resolve, reject) => {
        if (!isBulk) {
            var Tags = comboData.Tags.map((tag) => {
                return ObjectId(tag)
            });

            var new_combo = new Combo({
                CharacterId: comboData.CharacterId,
                Inputs: comboData.Inputs,
                Hits: comboData.Hits,
                Damage: comboData.Damage,
                Tags: Tags
            });

            new_combo.save(function (error, combo) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Post saved successfully!',
                        id: combo.id
                    });
                }
            });
        } else {
            Combo.insertMany(comboData, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Combos saved successfully!'
                    });
                }
            });
        }
    });
}

// Update a combo
function patchCombo(comboId, comboData) {
    return new Promise((resolve, reject) => {
        Combo.findById(comboId, 'CharacterId Inputs Hits Damage Tags', function (error, combo) {
            if (error) {
                reject(error);
                return;
            }

            combo.CharacterId = comboData.CharacterId;
            combo.Inputs = comboData.Inputs;
            combo.Hits = comboData.Hits;
            combo.Damage = comboData.Damage;
            combo.Tags = comboData.Tags.map((tag) => {
                return ObjectId(tag)
            });

            combo.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({success: true});
                }
            });
        });
    });
}

// Delete a combo
function deleteCombo(comboId) {
    return new Promise((resolve, reject) => {
        Combo.remove({
            _id: comboId
        }, function (err, combo) {
            if (err) {
                reject(err);
            } else {
                resolve({success: true});
            }
        });
    });
}

module.exports = {
    addCombo,
    patchCombo,
    deleteCombo
};
