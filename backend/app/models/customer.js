var mongoose = require('mongoose');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' },
};

var customerSchema = mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    customer_id :String,
    name : {
        type: String,
        unique: true,
    },
    status :String,
}, schemaOptions);

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
