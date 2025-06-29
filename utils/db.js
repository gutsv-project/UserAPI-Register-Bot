const mongoose = require('mongoose');
const config = require('../config.js');

mongoose.connect(config.mongoUri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB bağlantı hatası:'));
db.once('open', function() {
    console.log('MongoDB veritabanına başarıyla bağlandı.');
});

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    registerHistory: [{
        date: { type: Date, default: Date.now },
        name: String,
        age: Number,
        gender: String,
        staff: String
    }],
    banHistory: [{
        date: { type: Date, default: Date.now },
        reason: String,
        staff: String
    }],
    quarantineHistory: [{
        date: { type: Date, default: Date.now },
        reason: String,
        staff: String
    }]
});

const logSchema = new mongoose.Schema({
    type: String,
    userId: String,
    staff: String,
    date: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
});

const QueueSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    messageId: { type: String }
});

const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);
const Queue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);

module.exports = {
    User,
    Log,
    Queue
}; 