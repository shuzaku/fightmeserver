const mongoose = require('mongoose');
const Video = require('./models/videos');
const Combo = require('./models/combos');
const ComboClip = require('./models/combo-clips');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function testQuery() {
    try {
        console.log('Starting query test...');

        const characterId = new mongoose.Types.ObjectId();

        // 1. Create Data
        const video = new Video({
            Url: 'https://www.youtube.com/watch?v=querytest',
            ContentType: 'Combo',
            VideoType: 'YouTube',
            StartTime: '0:00',
            EndTime: '0:10',
            Tags: ['querytest'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await video.save();

        const combo = new Combo({
            CharacterId: characterId,
            Inputs: ['236A'],
            Hits: 5,
            Damage: 100,
            Tags: ['querytest'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await combo.save();

        const comboClip = new ComboClip({
            ComboId: combo._id,
            VideoId: video._id,
            StartTime: '0:05',
            EndTime: '0:08',
            Tags: ['querytest'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await comboClip.save();

        console.log('Data created. CharacterId:', characterId);

        // 2. Run Aggregation (simulating queryComboClips)
        const aggregate = [
            {
                '$lookup': {
                    'from': 'combos',
                    'localField': 'ComboId',
                    'foreignField': '_id',
                    'as': 'Combo'
                }
            },
            { '$unwind': '$Combo' },
            {
                '$lookup': {
                    'from': 'videos',
                    'localField': 'VideoId',
                    'foreignField': '_id',
                    'as': 'Video'
                }
            },
            { '$unwind': '$Video' },
            {
                '$match': { 'Combo.CharacterId': characterId }
            }
        ];

        const results = await ComboClip.aggregate(aggregate);

        if (results.length > 0 && results[0].Video.Url === video.Url) {
            console.log('SUCCESS: Aggregation returned correct data.');
            console.log('Result count:', results.length);
            console.log('Video URL:', results[0].Video.Url);
        } else {
            console.error('FAILURE: Aggregation did not return expected data.', results);
        }

        // Cleanup
        await Video.deleteOne({ _id: video._id });
        await Combo.deleteOne({ _id: combo._id });
        await ComboClip.deleteOne({ _id: comboClip._id });
        console.log('Cleanup done.');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        mongoose.disconnect();
    }
}

testQuery();
