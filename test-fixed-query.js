const mongoose = require('mongoose');
const ComboClip = require('./models/combo-clips');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

const ObjectId = require('mongodb').ObjectId;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function testFixedQuery() {
    try {
        const characterId = '68cba126f26150002289796c';
        console.log('Testing FIXED query for CharacterId:', characterId);
        console.log('='.repeat(60));

        // Simulate the exact query from the controller
        const skip = 0;
        const limit = 20;

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
                '$unwind': {
                    'path': '$Combo',
                    'preserveNullAndEmptyArrays': true
                }
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
                '$unwind': {
                    'path': '$Video',
                    'preserveNullAndEmptyArrays': true
                }
            }
        ];

        aggregate.push({
            '$match': { 'Combo.CharacterId': ObjectId(characterId) }
        });

        aggregate.push({ '$sort': { 'createdAt': -1 } });
        aggregate.push({ '$skip': skip });
        aggregate.push({ '$limit': limit });

        const results = await ComboClip.aggregate(aggregate);

        console.log('\n✅ Query Results:', results.length, 'combo-clips found');

        if (results.length > 0) {
            console.log('\nSample result:');
            console.log('  ComboClip ID:', results[0]._id);
            console.log('  Combo ID:', results[0].ComboId);
            console.log('  Character ID:', results[0].Combo?.CharacterId);
            console.log('  Has Video:', !!results[0].Video);
            console.log('  Video URL:', results[0].Video?.Url || 'NULL');
        }

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testFixedQuery();
