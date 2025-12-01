const mongoose = require('mongoose');

const bioSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'accounts',
        required: true
    },
    avatar: String,
    avatarCroppedStat: {
        zoom: Number,
        cropX: Number,
        cropY: Number,
    },
    avatarCroppedArea: {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
    },
    cover: String,
    coverCroppedStat: {
        zoom: Number,
        cropX: Number,
        cropY: Number,
    },
    coverCroppedArea: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
    },
    description: String
});

export const bioModel = mongoose.model('bios', bioSchema);