var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var tableSchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    timestamp :Date,
    log_string : String,
    customer_id : String,
    cluster_name : String,
    priority : String
}, schemaOptions);

var Logtable = mongoose.model('Logtable', tableSchema);
module.exports = Logtable;
