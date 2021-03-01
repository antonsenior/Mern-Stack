'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
    versionKey: false
};

let tokenCollectionSchema = new Schema({
    userId: {
        type: String,
        default: '',
        // enables us to search the record faster
        index: true,
        unique: true
    },
    authToken: {
        type: String,
        default: ''
    },
    tokenSecret: {
        type: String,
        default: ''
    },
    tokenGenerationTime: {
        type: String,
        default: ''
    },
    createdOn: {
        type: Date,
        default: ''
    },
}, schemaOptions)


mongoose.model('tokenCollection', tokenCollectionSchema);
