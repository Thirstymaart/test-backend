const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  foodType: {
    type: [String],
    enum:['veg', 'nonveg'],
  },
  parking: {
    type: [String], // Array of strings to hold multiple options
    enum: ['Free Parking', 'Paid Parking', 'Street Parking', 'Valet Parking', 'Parking Garage', 'No Parking'],
  },
  cuisine: {
    type: [String],
    enum: ['Italian', 'Chinese', 'Indian', 'Japanese', 'Mediterranean', 'American', 'Mexican', 'Thai', 'Vegan/Vegetarian', 'Seafood', 'Fast Food', 'Dessert'],
  },
  deliverySystem: {
    type: [String],
    enum: ['In-house Delivery', 'Third-party Delivery', 'Takeout Available', 'Curbside Pickup', 'No Delivery'],
  },
  bar: {
    type: [String],
    enum: ['Full Bar', 'Wine Bar', 'Beer Selection', 'Cocktails', 'Happy Hour', 'No Bar'],
  },
  amenities: {
    type: [String],
    enum: ['Free Wi-Fi', 'Swimming Pool', 'Fitness Center', 'Spa Services', 'Pet-Friendly', 'Room Service', 'Laundry Service', 'Business Center', 'Conference Rooms', 'Airport Shuttle'],
  },
  roomFeatures: {
    type: [String],
    enum: ['Air Conditioning', 'Heating', 'Mini Bar', 'Safe', 'Television', 'En-suite Bathroom', 'Balcony', 'Ocean View', 'City View', 'Kitchenette'],
  },
  diningOptions: {
    type: [String],
    enum: ['On-site Restaurant', 'Breakfast Included', 'Buffet', 'Café', 'Room Service', 'Bar/Lounge', 'Outdoor Dining'],
  },
  accessibility: {
    type: [String],
    enum: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Accessible Restrooms', 'Braille Menu', 'Service Animals Allowed'],
  },
  additionalServices: {
    type: [String],
    enum: ['Event Hosting', 'Wedding Services', 'Tour Desk', 'Concierge Service', 'Babysitting/Child Services', 'Luggage Storage'],
  },
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
