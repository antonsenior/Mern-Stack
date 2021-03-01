var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var displaySchema = mongoose.Schema({
    customer_id: String,
    cluster_name: String,
    display_item: String,
    display_item_value: String,
}, schemaOptions);

var Display = mongoose.model('Display', displaySchema);
module.exports = Display;
