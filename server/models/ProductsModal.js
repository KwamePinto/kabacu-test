const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  category: {
    type: String,
    required: true
  },
  images: [String],
  reward_point:{
    type:Number,
    default: 0
  },

  // NORMAL PRODUCT
  item_name: String,
  item_price: Number,
  description: String,
  // piece_price: Number,
  // item_type: String,

  // DATA PRODUCT
  dataDetails: {
    plan_id: Number,
    network: String,
    plan_type: String,
    plan_name: String,
    amount: Number,
    validate_period: String
  },

  // AUTOMOBILE PRODUCT
  automobileDetails: {
    brand: String,
    model: String,
    year: Number,
    fuel_type: String,
    transmission: String,
    price: Number,
    condition: String // new / used
  },
    //ElECTRONICS PRODUCT
  electronicDetails: {
    itemName: String,
    brandItem: String,
    itemtype: String,
    items_price: Number,
  },

   coursesDetails: {
    title: String,
    instructor: String,
    course_description: String,
    course_price: Number,
  },
   checkout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'checkout',
      
    },
     cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'cart',
      
    },

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);