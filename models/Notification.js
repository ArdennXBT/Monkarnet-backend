
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    cible: {
      type: String,
      enum: ['tous', 'commercants', 'sous-comptes'],
      default: 'tous',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);