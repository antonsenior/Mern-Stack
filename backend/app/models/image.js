var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var imageSchema = mongoose.Schema({
    img_id: String,
    img_name: String,
    severity_count: {
        total: {
            type: Number,
            default: 0
        },
        critical: {
            type: Number,
            default: 0
        },
        high: {
            type: Number,
            default: 0
        },
        medium: {
            type: Number,
            default: 0
        },
        low: {
            type: Number,
            default: 0
        },
        negligible: {
            type: Number,
            default: 0
        },
        unknown: {
            type: Number,
            default: 0
        }
    },
    vuln_list: Array,
    cluster_list: Object,
}, schemaOptions);

var Image = mongoose.model('Image', imageSchema);
module.exports = Image;
