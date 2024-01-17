const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

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
  contact:Number,
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
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model("user",userSchema);