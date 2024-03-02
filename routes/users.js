const mongoose = require('mongoose');
require('dotenv').config();
const plm = require('passport-local-mongoose');


const Connection = async () => {
  const URL = process.env.DB_CONNECTION_STRING;
  
  try {
    await mongoose.connect(URL);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
};

Connection();


const userSchema = mongoose.Schema({
  username:{
    type: String,
        unique: true,
        required: true,
        trim: true, // Automatically trims whitespace from both ends
        validate: {
            validator: function(value) {
                // Check if the username contains any whitespace
                return !/\s/.test(value);
            },
            message: 'Username must not contain spaces'
        }
  },
  name:String,
  city:String,
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
  currCount:{
    type:Number,
    default:0
  },
  totalCount:{
    type:Number,
    default:0
  },
  rank:{
    type:Number
  },
  dailyCounts: [
    {
      date: { type: Date},
      count: { type: Number, default: 0 },
    },
  ],
  mala:{
    type:Number,
    default:0
  },
  role: {
    type: String,
    default: 'user'
},
joiningDate: {
  type: Date,
  default: Date.now 
}
});

userSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const count = await this.constructor.countDocuments();
      this.rank = count+1;
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.plugin(plm);



module.exports = mongoose.model("user",userSchema);