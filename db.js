const mongoose = require('mongoose')
const dotenv = require('dotenv');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment variables based on the current environment
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env' });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
}

const mongoURI = process.env.MONGO_URI;
console.log(mongoURI);


const conectToMongo = () => {
    mongoose.connect(mongoURI)
    console.log('conected to mongo sucesfully')
}

module.exports = conectToMongo;