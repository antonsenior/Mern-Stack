const mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

const resourceHistorySchema = mongoose.Schema({
        customer_id: String,
        cluster_name: String,
        nodes: String,
        pods: String,
        services: String,
        cnox_pods: String,
        cnox_services: String,
        cnox_cpu: String,
        cnox_mem: String,
        node_resource_json: String,
        timestamp: {type: Date, default: new Date()}
    },schemaOptions);

var ResourceHistory = mongoose.model('ResourceHistory', resourceHistorySchema);
module.exports = ResourceHistory;
