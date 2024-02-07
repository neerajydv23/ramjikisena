var express = require('express');
var router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('./users')
const ExcelJS = require('exceljs');
const cors = require('cors');

passport.use(new localStrategy(userModel.authenticate()))


router.post('/save', isLoggedIn, async function(req, res) {
  try {
    const user = req.user;
    const { currentCount, totalCount, malaCount } = req.body;

    // user.currCount = currentCount;
    user.totalCount = totalCount;
    user.mala = malaCount;
    user.currCount = 0;

    await user.save();

    res.json({ message: 'Counts and Mala updated successfully' });
  } catch (error) {
    console.error('Error updating counts and Mala:', error);
    res.status(500).json({ error: 'An error occurred while updating counts and Mala' });
  }
});

/* GET home page. */
router.get('/', async function (req, res, next) {
  const userCount = (await userModel.find()).length;

  const allUsers = await userModel.find();
  let totalRamnaamCount = 0;

  allUsers.forEach(user => {
    totalRamnaamCount += user.totalCount;
  })

  res.render('index', { userCount, totalRamnaamCount, error: req.flash('error') });
});

router.get('/register', function (req, res, next) {
  res.render('register', { error: req.flash('error') });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const userCount = (await userModel.find()).length;
  res.render('profile', { user: req.user, userCount });
});

router.get('/allDevotees', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.user.username });
  const allUsers = await userModel.find();
  res.render('allDevotees', { user, allUsers });
});
router.get('/gallery', async function (req, res, next) {
  res.render('gallery');
});

router.get('/name/:name', isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.name}`, 'i');
  const users = await userModel.find({ name: regex });
  res.json(users);
});


router.get('/increment', isLoggedIn, async function (req, res, next) {
  const user = req.user;

  // user.currCount += 1;
  // user.totalCount += 1;
  // user.mala = (user.totalCount / 108).toFixed(2);

  const today = new Date();

  const hasEntryForToday = user.dailyCounts.some(entry => {
    return entry.date.toDateString() === today.toDateString();
  });

  if (hasEntryForToday) {
    user.dailyCounts[user.dailyCounts.length - 1].count++;
  } else {
    user.dailyCounts.push({ date: today, count: 1 });
  }

  await user.save();

  const allUsers = await userModel.find({}, 'totalCount').sort({ totalCount: -1 });
  const bulkUpdateOps = allUsers.map((user, index) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { rank: index + 1 }
    }
  }));
  await userModel.bulkWrite(bulkUpdateOps);

  res.json({ mala: user.mala, newCount: user.currCount, totalCount: user.totalCount });
});


// router.get('/save', isLoggedIn, async function (req, res, next) {

//   const user = req.user;
//   user.currCount = 0;
//   await user.save();

//   // writing rank feature

//   const allUsers = await userModel.find({}, 'totalCount').sort({ totalCount: -1 });
//   const bulkUpdateOps = allUsers.map((user, index) => ({
//     updateOne: {
//       filter: { _id: user._id },
//       update: { rank: index + 1 }
//     }
//   }));
//   await userModel.bulkWrite(bulkUpdateOps);

//   res.json({ currentCount: user.currCount, totalCount: user.totalCount, mala: user.mala });
// });

router.get('/lekhanHistory', async function (req, res) {
  const user = req.user;

  res.render('lekhanHistory', { user });
})

router.get('/impTemples', function (req, res) {
  res.render('impTemples');
})

router.get('/mission', function (req, res) {
  res.render('mission');
})
router.get('/forgot', function (req, res) {
  res.render('forgot', { error: req.flash('error') });
})
router.post('/forgot', async function (req, res, next) {
  const { contact } = req.body;

  try {
    // Check if the provided username and phone number match the registered details
    const user = await userModel.findOne({ contact });

    if (user) {
      // If the user is found, log them in without password verification
      req.login(user, function (err) {
        if (err) { return next(err); }
        return res.redirect('/profile');
      });
    } else {
      // If no user is found, display an error message
      req.flash('error', 'Invalid phone number');
      return res.redirect('/forgot');
    }
  } catch (err) {
    // Handle any errors that occur during the process
    console.error('Error:', err);
    req.flash('error', 'An error occurred. Please try again later.');
    return res.redirect('/forgot');
  }
});

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

router.post('/register', function (req, res, next) {

  if (!req.body.username || !req.body.fullname || !req.body.password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/register');
  }

  const data = new userModel({
    username: req.body.username,
    city: req.body.city,
    contact: req.body.contact,
    name: req.body.fullname
  })
  userModel.register(data, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      })
    })
    .catch(function (err) {
      // Handle registration failure (e.g., username/email already taken)
      req.flash('error', 'Please choose a different Login Id or try removing spaces from Login Id.');
      res.redirect('/');
    });
});

router.get('/admin/allUsers', async (req, res) => {
  try {
    // Retrieve all users sorted by totalCount in descending order
    const users = await userModel.find().sort({ totalCount: -1 });

    // Render the allUsers.ejs template with user data
    res.render('admin/allUsers', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/admin/dashboard', async function (req, res) {
  const userCount = (await userModel.find()).length;

  const allUsers = await userModel.find();
  let totalRamnaamCount = 0;

  allUsers.forEach(user => {
    totalRamnaamCount += user.totalCount;
  })
  res.render('admin/dashboard', { userCount, totalRamnaamCount });
})

// router.post('/login', passport.authenticate("local",{
//   failureRedirect:"/",
//   successRedirect:"/profile",
//   failureFlash:true
// }),function(req,res,next){
// });
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  failureFlash: true
}), function (req, res) {

  if (req.user.role === 'admin') {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/profile');
  }
});

router.get('/admin/downloadUsers', async (req, res) => {
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

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}


module.exports = router;
