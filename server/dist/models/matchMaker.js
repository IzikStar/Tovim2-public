import { Schema, model, } from 'mongoose';
import crypto from 'crypto';
import { Gender, Sector } from './enums.js';
const matchMakerSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: {
        type: String,
        required: true,
        match: /^\+?\d{7,15}$/,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /.+@.+\..+/,
    },
    password: { type: String, required: true },
    city: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    sector: { type: String, enum: Object.values(Sector), required: true },
    expertSectors: {
        type: [String],
        enum: Object.values(Sector),
        default: [],
    },
    ageRange: {
        type: new Schema({
            min: { type: Number, min: 18 },
            max: { type: Number, min: 18 },
        }, { _id: false }),
    },
    // MongoDB provides an _id field by default
}, { timestamps: true });
matchMakerSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        this.password = crypto
            .createHash('sha256')
            .update(this.password)
            .digest('hex');
    }
    next();
});
export const MatchMaker = model('MatchMaker', matchMakerSchema);
