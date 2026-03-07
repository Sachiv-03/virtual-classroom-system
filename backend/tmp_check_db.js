const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Object = require('mongoose').Types.ObjectId;

dotenv.config({ path: 'd:/projects/virtual classroom system/backend/.env' });

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB");
    const db = mongoose.connection.useDb('test'); // Or whatever the DB name is, mongoose uses default from URI

    // We will just query the users collection
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Total users found: ${users.length}`);
    users.forEach(u => console.log(u.email, u.name, u.role));

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
