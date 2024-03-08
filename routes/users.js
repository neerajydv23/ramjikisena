const mongoose = require('mongoose');
require('dotenv').config();
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required'],
    trim: true,
    validate: {
      validator: function (value) {
        // Check if the username contains any whitespace
        return !/\s/.test(value);
      },
      message: 'Username must not contain spaces'
    }
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  password: {
    type: String,
    required: true
  },
  profileImage: String,
  contact: {
    type: String,
    unique: true,
    validate: {
      validator: function (v) {
        return /^([0-9]{10}$)/.test(v);
      }
    },
    required: [true, 'Contact is required'],
    trim: true,
  },
  currCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number
  },
  dailyCounts: [
    {
      date: { type: Date },
      count: { type: Number, default: 0 },
    },
  ],
  mala: {
    type: Number,
    default: 0
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

userSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const count = await this.constructor.countDocuments();
      this.rank = count + 1;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// bcryptjs

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Error hashing the password', error);
  }
});

// jsonwebtoken
userSchema.methods.generateToken = async function () {
  try {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.EXPIRE });
  } catch (error) {
    console.error('Error generating token', error);
  }
};

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  try {
    return bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};


module.exports = mongoose.model("user", userSchema);