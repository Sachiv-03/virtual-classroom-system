const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config({ path: 'd:/projects/virtual classroom system/backend/.env' });

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    // Current user is "miller" (miller@email.com)
    const miller = await User.findOne({ email: 'miller@email.com' });
    if (!miller) {
        console.log("Miller not found");
        process.exit();
    }
    console.log("Miller ID:", miller._id);
    console.log("Miller Role:", miller.role);

    let query = { _id: { $ne: miller._id } };

    if (miller.role === 'student') query.role = 'teacher';
    else if (miller.role === 'teacher') query.role = 'student';

    console.log("Query 1:", query);
    let suggestions = await User.find(query).select('name email role').limit(10);
    console.log("Suggestions 1:", suggestions);

    if (suggestions.length === 0) {
        console.log("Fallback query:", { _id: { $ne: miller._id } });
        suggestions = await User.find({ _id: { $ne: miller._id } }).select('name email role').limit(10);
        console.log("Suggestions 2:", suggestions);
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
