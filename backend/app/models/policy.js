const mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

const policySchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    policy_id :String,
    customer_id :String,
    policy_body : Object,
}, schemaOptions);

var Policy = mongoose.model('Policy', policySchema);
module.exports = Policy;
