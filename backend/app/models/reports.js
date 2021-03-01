const mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

const reportsSchema = mongoose.Schema({
        customername: String,
        customer_id: String,
        cluster_name: String,
        report_id: String,
        report_type: String,
        timestamp: Date,
        summary_json: Object,
        recommend_json: Object,
        raw_report: String,
        img: Array
    }, schemaOptions);

var Reports = mongoose.model('reports', reportsSchema);
module.exports = Reports;
