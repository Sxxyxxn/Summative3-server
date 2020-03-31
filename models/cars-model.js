const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./comments-model");

// this will be our data base's data structure
var CarsSchema = new Schema(
  {
    make: String,
    model: String,
    price: Number,
    year: String,
    odometer: String,
    car_image: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

CarsSchema.virtual("comments", {
  ref: "Comment",
  localField: "model",
  foreignField: "car_name",
  justOne: false
});

// singular capitalized name for the mongo collection name
module.exports = mongoose.model("Car", CarsSchema);
