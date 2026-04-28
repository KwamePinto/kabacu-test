// models/Stock.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subdocument schema for items
const dataPackagesSchema = new Schema({
  plan_id: {
    type: Number,
   
  },
  network: {
    type: String,
    
  },
  plan_type: {
    type: String,
    
  },
  plan_name: {
    type: String,
    
  },
  amount: {
    type: Number,
    
  },
  validate_period: {
    type: String,
   
  },
  checkout:{
          type: mongoose.Schema.Types.ObjectId,
              ref: 'checkout',
      }
  
  
 
});

module.exports = mongoose.model('package', dataPackagesSchema);
