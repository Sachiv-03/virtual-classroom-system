const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Message = require('./src/models/Message');
const Conversation = require('./src/models/Conversation');

dotenv.config();

const migrateMessages = async () => {
    try {
        await connectDB();
        console.log('Migrating legacy messages to new Conversations architecture...');

        const legacyMessages = await mongoose.connection.collection('messages').find({
            conversationId: { $exists: false }
        }).toArray();

        console.log(`Found ${legacyMessages.length} legacy messages.`);

        let count = 0;
        for (const msg of legacyMessages) {
            // Find or create conversation for these two users
            let conv = await Conversation.findOne({
                isGroup: false,
                members: { $all: [msg.sender, msg.receiver] }
            });

            if (!conv) {
                conv = await Conversation.create({
                    members: [msg.sender, msg.receiver],
                    lastMessage: msg._id
                });
            } else {
                // Update lastMessage if this message is newer
                conv.lastMessage = msg._id;
                await conv.save();
            }

            // Update the message document to match the new schema
            await mongoose.connection.collection('messages').updateOne(
                { _id: msg._id },
                {
                    $set: {
                        conversationId: conv._id,
                        senderId: msg.sender,
                        messageType: 'text',
                        text: msg.content,
                        status: msg.read ? 'seen' : 'delivered'
                    },
                    $unset: {
                        sender: "",
                        receiver: "",
                        content: "",
                        read: ""
                    }
                }
            );
            count++;
        }

        console.log(`Successfully migrated ${count} legacy messages.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateMessages();
