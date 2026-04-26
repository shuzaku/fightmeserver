const mongoose = require('mongoose');
const Video = require('./models/videos');
const Combo = require('./models/combos');
const ComboClip = require('./models/combo-clips');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function testFlow() {
    try {
        console.log('Starting test flow...');

        // 1. Create a Video
        const video = new Video({
            Url: 'https://www.youtube.com/watch?v=testvideo',
            ContentType: 'Combo',
            VideoType: 'YouTube',
            StartTime: '0:00',
            EndTime: '0:10',
            Tags: ['test'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await video.save();
        console.log('Video created:', video._id);

        // 2. Create a Combo (simulating addCombo controller logic)
        // In the controller, addCombo creates Combo then finds Video then creates ComboClip.
        // We will simulate that manually here to verify the schema.

        const combo = new Combo({
            CharacterId: new mongoose.Types.ObjectId(),
            Inputs: ['236A'],
            Hits: 5,
            Damage: 100,
            Tags: ['test'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await combo.save();
        console.log('Combo created:', combo._id);

        const comboClip = new ComboClip({
            ComboId: combo._id,
            VideoId: video._id, // This is the key link
            StartTime: '0:05',
            EndTime: '0:08',
            Tags: ['test'],
            SubmittedBy: new mongoose.Types.ObjectId(),
            UpdatedBy: new mongoose.Types.ObjectId()
        });
        await comboClip.save();
        console.log('ComboClip created:', comboClip._id);

        // 3. Verify Lookups

        // Verify Video -> ComboClip lookup (simulating getVideo)
        const videoWithClip = await Video.aggregate([
            { $match: { _id: video._id } },
            {
                $lookup: {
                    from: 'combo-clips',
                    localField: '_id',
                    foreignField: 'VideoId',
                    as: 'ComboClip'
                }
            }
        ]);

        if (videoWithClip[0].ComboClip.length > 0 && videoWithClip[0].ComboClip[0].VideoId.toString() === video._id.toString()) {
            console.log('SUCCESS: Video -> ComboClip lookup works.');
        } else {
            console.error('FAILURE: Video -> ComboClip lookup failed.', videoWithClip);
        }

        // Verify ComboClip -> Video lookup (simulating getComboClip)
        const clipWithVideo = await ComboClip.aggregate([
            { $match: { _id: comboClip._id } },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'VideoId',
                    foreignField: '_id',
                    as: 'Video'
                }
            },
            { $unwind: '$Video' },
            { $addFields: { Url: '$Video.Url' } }
        ]);

        if (clipWithVideo[0].Url === video.Url) {
            console.log('SUCCESS: ComboClip -> Video lookup works. Url retrieved:', clipWithVideo[0].Url);
        } else {
            console.error('FAILURE: ComboClip -> Video lookup failed.', clipWithVideo);
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

testFlow();
