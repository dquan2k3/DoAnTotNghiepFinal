const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts',
    required: true
  },
  username: String,
  usernameChangedDate: Date,
  name: String,
  nameChangedDate: Date,
  living: String,
  dateliving: Date,
  privateliving: String,
  hometown: String,
  privatehometown: String,
  birthday: Date,
  privatebirthday: String,
  school: String,
  privateSchool: String,
  graduated: Boolean
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts',
    required: true
  },
  emailcontact: { type: String, default: "" },
  phone: { type: String, default: "" },
  website: { type: String, default: "" }
}, { timestamps: true });

// Sự kiện trong đời (Life Event) model
const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts',
    required: true
  },
  name: { type: String, required: true },
  datetime: { type: Date }
}, { timestamps: true });

export const profileModel = mongoose.model('profiles', profileSchema);
export const contactModel = mongoose.model('contacts', contactSchema);
export const eventModel = mongoose.model('events', eventSchema);
