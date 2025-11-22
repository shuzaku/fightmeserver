const mongoose = require('mongoose');
const ComboClip = require('./models/combo-clips');
const Combo = require('./models/combos');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function quickCheck() {
    try {
        const characterId = '68cba126f26150002289796c';

        // Check combo-clips count
        const clipCount = await ComboClip.countDocuments();
        console.log('Total combo-clips:', clipCount);

        // Check combos with this character
        const combos = await Combo.find({ CharacterId: mongoose.Types.ObjectId(characterId) }).limit(5);
        console.log('Combos for character:', combos.length);

        if (combos.length > 0) {
            console.log('Sample combo ID:', combos[0]._id.toString());

            // Check if there are clips for these combos
            const clips = await ComboClip.find({ ComboId: combos[0]._id });
            console.log('Clips for first combo:', clips.length);

            if (clips.length > 0) {
                console.log('Sample clip:', {
                    _id: clips[0]._id.toString(),
                    ComboId: clips[0].ComboId.toString(),
                    VideoId: clips[0].VideoId ? clips[0].VideoId.toString() : 'NULL',
                    hasVideoId: !!clips[0].VideoId
                });
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

quickCheck();
