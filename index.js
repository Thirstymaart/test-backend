const conectToMongo = require('./db')
const express = require('express')
const cors = require('cors');

conectToMongo()
const app = express()
const port = 3001
app.use(express.json())
app.use(cors());
app.use('/uploads', express.static('uploads'));



// available routes
app.use('/api/user' , require('./routes/SignupRoute'))
app.use('/api/vendorinfo' , require('./routes/VendorInfoRoute'))
app.use('/api/products', require('./routes/ProductRoute'));
app.use('/api/analysis', require('./routes/productAnalysisRoute'));
app.use('/api/categories', require('./routes/categoryRoute'));
app.use('/api/review', require('./routes/reviewsRoute'));
app.use('/api/search', require('./routes/searchRoute'));
app.use('/api/profile', require('./routes/profileRoute'));
app.use('/api/imageupload', require('./routes/imageUpload'));



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

/* 

app
  component
    navbar.js
  dashboard
    editprofilehome
      page.js
    dashnav.jsx
    layout.js
    page.js
  login
    page.jsx
  profile
    page.js
  page.js
  layout.js
public

*/
