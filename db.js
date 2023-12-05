const mongoose = require('mongoose')
const mongoURI = process.env.MONGO_URI;

const conectToMongo = () => {
    mongoose.connect(mongoURI)
    console.log('conected to mongo sucesfully')

}

module.exports = conectToMongo;