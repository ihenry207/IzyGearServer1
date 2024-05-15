const mongoose = require("mongoose")

const ListingSnowSki = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      category: {// this can be snowboard, ski, camping, biking
        type: String,
        required: true,
      },
      brand:{
        type: String,
        required: true,
      },
      gender:{
        type:String,
        required: true,
      },
      size:{
        type: Number,
        required:true,
      },
      price: {
        type: Number,
        required: true,
      },
      streetAddress: {
        type: String,
        required: true,
      },
      aptSuite: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zip:{
        type: String,
        required: true,
      },
      condition:{
        type: String,
        required: true,
      },
      boots:{
        type: Boolean,
        required: true,
      },
      bindings:{
        type: Boolean,
        required: true,
      },
      description: {
        type: String,
        required: true
      },
      listingPhotoPaths: [{ type: String }], // Store photo URLs
      title: {
        type: String,
        required: true
       },

       
}, { timestamps: true}
)

const ListingSkiSnow = mongoose.model("ListingSkiSnow", ListingSnowSki)
module.exports = ListingSkiSnow