const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    Role: { type: String, default: 'User' },
  }, { timestamps: true });

export const accountModel = mongoose.model('accounts', authSchema);