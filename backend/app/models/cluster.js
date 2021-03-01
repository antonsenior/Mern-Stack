var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var clusterSchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    cluster_name :String,
    cnox_stack : String,
    cnox_engine_url :String,
    Nodes : Number,
    Pods : Number,
    Services : Number,
    monitor_url : String,
    license_key : String,
    scanner_url :String,
    compliance_url: String
}, schemaOptions);

var Cluster = mongoose.model('Cluster', clusterSchema);
module.exports = Cluster;
