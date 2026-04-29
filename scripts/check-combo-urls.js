const mongoose = require('mongoose');
const ComboClip = require('./models/combo-clips');
const Combo = require('./models/combos');
require('dotenv').config();

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

async function checkComboUrls() {
    try {
        console.log('Checking combo structure...\n');

        // Get a sample combo to see what fields it has
        const sampleCombo = await Combo.findOne();
        console.log('Sample Combo fields:', Object.keys(sampleCombo.toObject()));
        console.log('Sample Combo:', JSON.stringify(sampleCombo, null, 2));

        // Check if combos have a Url field
        const combosWithUrl = await Combo.countDocuments({ Url: { $exists: true, $ne: null } });
        console.log('\nCombos with Url field:', combosWithUrl);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkComboUrls();
