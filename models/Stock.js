const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
    stock: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    updated_at: {
        type: Date
    },
    who_liked: {
        type: Array
    }
});

module.exports = mongoose.model("Stock", StockSchema);