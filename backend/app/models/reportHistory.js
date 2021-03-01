var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var reportHistorySchema = mongoose.Schema({
    customer_id: String,
    cluster_name: String,
    timestamp: Date,
    report_type: String,
    summary_json: Object,
}, schemaOptions);

var ReportHistory = mongoose.model('ReportHistory', reportHistorySchema);
module.exports = ReportHistory;
