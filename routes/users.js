const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const MockDate = require('mockdate');
MockDate.set('2024-01-20T12:00:00Z');


// mongoose.connect("mongodb://127.0.0.1:27017/ramnaambank");
const Connection = async () => {
  const URL = 'mongodb+srv://yneeraj082r:jT5N0eg3sTUj0XFy@ramnaambank.vyriomp.mongodb.net/?retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(URL);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
};

Connection();


const userSchema = mongoose.Schema({
  username: String,
  name:String,
  email:String,
  password:String,
  profileImage:String,
  contact:{
    type:String, 
    unique:true,
    validate: {
    validator: function(v) {
      return /^([0-9]{10}$)/.test(v);
    }},
    required: true
    },
  prevCount:{
    type:Number,
    default:"0"
  },
  currCount:{
    type:Number,
    default:"0"
  },
  totalCount:{
    type:Number,
    default:"0"
  },
  rank:{
    type:Number,
    default:"0"
  },
  dailyCounts: [
    {
      date: { type: Date, default: Date.now },
      count: { type: Number, default: 0 },
    },
  ],
});

userSchema.plugin(plm);


module.exports = mongoose.model("user",userSchema);