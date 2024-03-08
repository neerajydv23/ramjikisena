/* '/profile' page has been converted to '/' page and '/' page to '/login' page */

var express = require('express');
var router = express.Router();
const userModel = require('./users')
const ExcelJS = require('exceljs');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Axios request to increment and save counts
router.post('/save', isLoggedIn, async function (req, res) {
  try {
    const user = req.user;
    const loggedInUser = await userModel.findOne({ _id: user._id });
    const { currentCount, totalCount, malaCount } = req.body;

    loggedInUser.totalCount += parseInt(currentCount);
    loggedInUser.mala = loggedInUser.totalCount !== 0 ? (loggedInUser.totalCount / 108).toFixed(2) : 0.00;
    loggedInUser.currCount = 0;

    // Update dailyCounts
    const today = new Date();

    const hasEntryForToday = loggedInUser.dailyCounts &&
      loggedInUser.dailyCounts.length > 0 &&
      loggedInUser.dailyCounts[loggedInUser.dailyCounts.length - 1].date.toDateString() === today.toDateString();

    if (hasEntryForToday) {
      loggedInUser.dailyCounts[loggedInUser.dailyCounts.length - 1].count += parseInt(currentCount);
    } else {
      loggedInUser.dailyCounts.push({ date: today, count: parseInt(currentCount) });
    }

    await loggedInUser.save();

    res.json({ message: 'Counts, Mala, and Daily Counts updated successfully' });
  } catch (error) {
    console.error('Error updating counts, Mala, and Daily Counts:', error);
    res.status(500).json({ error: 'An error occurred while updating counts, Mala, and Daily Counts' });
  }
});

// Profile page
router.get('/', isLoggedIn, async function (req, res, next) {
  try {
    // Update ranks
    const allUsers = await userModel.find({}, 'totalCount').sort({ totalCount: -1 });
    const bulkUpdateOps = allUsers.map((userDoc, index) => ({
      updateOne: {
        filter: { _id: userDoc._id },
        update: { rank: index + 1 }
      }
    }));
    await userModel.bulkWrite(bulkUpdateOps);

    const userCount = allUsers.length;
    const user = req.user;
    const loggedInUser = await userModel.findOne({ _id: user._id });
    res.render('index', { user: loggedInUser, userCount });
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

// static routes

router.get('/allDevotees', isLoggedIn, async function (req, res, next) {
  try {
    const user = req.user;
    const loggedInUser = await userModel.findOne({ _id: user._id });
    const allUsers = await userModel.find();
    res.render('allDevotees', { user: loggedInUser, allUsers });
  }
  catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

router.get('/gallery', async function (req, res, next) {
  res.render('gallery');
});

router.get('/user/:name', isLoggedIn, async function (req, res) {
  try {
    const val = req.params.name;
    const users = await userModel.find({ name: new RegExp('^' + val, 'i') });
    res.json(users);
  }
  catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

router.get('/lekhanHistory', isLoggedIn, async function (req, res) {
  try {
    const user = req.user;
    const loggedInUser = await userModel.findOne({ _id: user._id });
    res.render('lekhanHistory', { user: loggedInUser });
  }
  catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
})

router.get('/impTemples', function (req, res) {
  res.render('impTemples');
})

router.get('/mission', function (req, res) {
  res.render('mission');
})

router.get('/about', function (req, res) {
  res.render('about');
})

router.get('/glory', function (req, res) {
  res.render('glory');
})

router.get('/feedback', function (req, res) {
  res.render('feedback');
})

router.get('/contact', function (req, res) {
  res.render('contact');
})

// Admin routes

router.get('/admin/allUsers', isAdmin, async (req, res) => {
  try {
    const users = await userModel.find().sort({ totalCount: -1 });
    res.render('admin/allUsers', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/admin/dashboard', isAdmin, async function (req, res) {
  try {
    const allUsers = await userModel.find();
    const userCount = allUsers.length;

    let totalRamnaamCount = allUsers.reduce((total, user) => total + user.totalCount, 0);

    res.render('admin/dashboard', { userCount, totalRamnaamCount });
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

router.get('/admin/downloadUsers', isAdmin, async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await userModel.find();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Define worksheet headers
    worksheet.columns = [
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Total Count', key: 'totalCount', width: 15 },
      { header: 'Contact', key: 'contact', width: 15 }
      // Add more columns as needed
    ];

    // Populate worksheet with user data
    users.forEach(user => {
      worksheet.addRow({
        username: user.username,
        name: user.name,
        city: user.city,
        totalCount: user.totalCount,
        contact: user.contact
        // Add more fields as needed
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');

    // Serialize workbook to response
    await workbook.xlsx.write(res);

    // End response
    res.end();
  } catch (error) {
    console.error('Error downloading users:', error);
    res.status(500).send('Error downloading users');
  }
});


// Auth routes

router.get('/register', function (req, res, next) {
  res.render('register', { error: req.flash('error') });
});

router.post('/register', async function (req, res, next) {
  try {

    if (!req.body.username || !req.body.name || !req.body.password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }

    const { username, name, city, password, contact } = req.body;

    if (!/^([0-9]{10})$/.test(contact)) {
      req.flash('error', 'Contact number should be 10 digits');
      return res.redirect('/register');
    }

    const existingUserContact = await userModel.findOne({ contact });
    if (existingUserContact) {
      req.flash('error', 'This contact already exists');
      return res.redirect('/register');
    }

    const existingUserUsername = await userModel.findOne({ username });
    if (existingUserUsername) {
      req.flash('error', 'This username already exists');
      return res.redirect('/register');
    }

    const data = await userModel.create({ username, name, city, contact, password })

    const token = await data.generateToken();
    res.cookie('token', token, { httpOnly: true }); // Set token as a cookie
    res.redirect('/'); // Redirect to / page
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  };

});

router.get('/login', async function (req, res, next) {
  try {
    const allUsers = await userModel.find();
    const userCount = allUsers.length;

    const totalRamnaamCount = allUsers.reduce((total, user) => total + user.totalCount, 0);

    res.render('login', { userCount, totalRamnaamCount, error: req.flash('error') });
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    const userExist = await userModel.findOne({ username });
    if (!userExist) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const user = await userExist.comparePassword(password);
    // user contains true/false
    if (user) {
     
      const token = await userExist.generateToken();
      res.cookie('token', token, { httpOnly: true }); // Set token as a cookie

      if (userExist.role === 'admin') {
        res.redirect('/admin/dashboard');
      } else {
        res.redirect('/');
      }

    } else {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while login' });
  };

});

router.get('/logout', (req, res) => {
  try {
    res.clearCookie('token');
    res.redirect('/login');
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/forgot', function (req, res) {
  res.render('forgot', { error: req.flash('error') });
})

router.post('/forgot', async function (req, res, next) {
  try {
    const { contact } = req.body;
    const user = await userModel.findOne({ contact });

    if (user) {
      const token = await user.generateToken();
      res.cookie('token', token, { httpOnly: true });
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/');
      }
    }
    else {
      req.flash('error', 'Invalid phone number');
      return res.redirect('/forgot');
    }
  } catch (err) {
    console.error('Error:', err);
    req.flash('error', 'An error occurred. Please try again later.');
    return res.redirect('/forgot');
  }
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (token == null) return res.redirect('/login');

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.redirect('/login');
      }
      return res.redirect('/login');
    }
    req.user = user;
    next();
  });
}

async function isAdmin(req, res, next) {
  const token = req.cookies.token;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
    if (err) return res.sendStatus(403);
    const userRole = await userModel.findById(user._id);
    if (userRole.role != 'admin') {
      res.status(400).json({ success: false, message: "only admin is allowed" });
      res.redirect('/login');
    } else {
      req.user = user;
      next();
    }
  });
}
module.exports = router;
