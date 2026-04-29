const mongoose = require('mongoose');
const ComboClip = require('./models/combo-clips');
const Combo = require('./models/combos');
const Video = require('./models/videos');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function debugQuery() {
    try {
        const characterId = '68cba126f26150002289796c';
        console.log('Testing query for CharacterId:', characterId);
        console.log('='.repeat(60));

        // Step 1: Check if there are any combo-clips at all
        const totalClips = await ComboClip.countDocuments();
        console.log('\n1. Total combo-clips in database:', totalClips);

        // Step 2: Check if there are combos with this CharacterId
        const combosWithCharacter = await Combo.find({ CharacterId: mongoose.Types.ObjectId(characterId) });
        console.log('\n2. Combos with CharacterId:', combosWithCharacter.length);
        if (combosWithCharacter.length > 0) {
            console.log('   Sample combo IDs:', combosWithCharacter.slice(0, 3).map(c => c._id.toString()));
        }

        // Step 3: Check if there are combo-clips linked to those combos
        const comboIds = combosWithCharacter.map(c => c._id);
        const clipsForCombos = await ComboClip.find({ ComboId: { $in: comboIds } });
        console.log('\n3. Combo-clips linked to those combos:', clipsForCombos.length);
        if (clipsForCombos.length > 0) {
            console.log('   Sample clip:', {
                _id: clipsForCombos[0]._id,
                ComboId: clipsForCombos[0].ComboId,
                VideoId: clipsForCombos[0].VideoId
            });
        }

        // Step 4: Run the actual aggregation from the controller
        console.log('\n4. Running aggregation pipeline...');
        const aggregate = [
            {
                '$lookup': {
                    'from': 'combos',
                    'localField': 'ComboId',
                    'foreignField': '_id',
                    'as': 'Combo'
                }
            },
            {
                '$unwind': '$Combo'
            },
            {
                '$lookup': {
                    'from': 'videos',
                    'localField': 'VideoId',
                    'foreignField': '_id',
                    'as': 'Video'
                }
            },
            {
                '$unwind': '$Video'
            }
        ];

        // Test without the match first
        const resultsWithoutMatch = await ComboClip.aggregate(aggregate);
        console.log('   Results without CharacterId filter:', resultsWithoutMatch.length);

        // Now add the match
        aggregate.push({
            '$match': { 'Combo.CharacterId': mongoose.Types.ObjectId(characterId) }
        });

        const resultsWithMatch = await ComboClip.aggregate(aggregate);
        console.log('   Results WITH CharacterId filter:', resultsWithMatch.length);

        if (resultsWithMatch.length > 0) {
            console.log('\n✅ SUCCESS: Found results!');
            console.log('   Sample result:', {
                ComboId: resultsWithMatch[0].ComboId,
                CharacterId: resultsWithMatch[0].Combo?.CharacterId,
                VideoUrl: resultsWithMatch[0].Video?.Url
            });
        } else {
            console.log('\n❌ ISSUE: No results found');

            // Additional debugging
            if (resultsWithoutMatch.length > 0) {
                console.log('\n   Checking CharacterIds in unfiltered results:');
                const uniqueCharIds = [...new Set(resultsWithoutMatch.map(r => r.Combo?.CharacterId?.toString()))];
                console.log('   Unique CharacterIds found:', uniqueCharIds.slice(0, 10));
                console.log('   Looking for:', characterId);
            }
        }

        console.log('\n' + '='.repeat(60));

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        mongoose.disconnect();
    }
}

debugQuery();
