var express = require('express');
var router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('./users')
const cors = require('cors');


passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', async function(req, res, next) {
  const userCount = (await userModel.find()).length;

  const allUsers = await userModel.find();
  let totalRamnaamCount = 0;

  allUsers.forEach(user =>{
    totalRamnaamCount += user.totalCount;
  })

  res.render('index', {userCount,totalRamnaamCount,error: req.flash('error')});
});

router.get('/register', function(req, res, next) {
  res.render('register', {error: req.flash('error')});
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const userCount = (await userModel.find()).length;
  res.render('profile',{user:req.user,userCount});
});

router.get('/allDevotees', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});
  const allUsers = await userModel.find();
  res.render('allDevotees',{user,allUsers});
});
router.get('/gallery', async function(req, res, next) {
  res.render('gallery');
});

router.get('/name/:name', isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.name}`,'i');
  const users = await userModel.find({name:regex});
  res.json(users);
});


router.get('/increment', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});

  user.currCount +=1;
  user.totalCount+=1;

  user.mala = (user.totalCount / 108).toFixed(2);


  // const today = new Date().toDateString();  
  const todayString = new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}); 
  const today = new Date(todayString);
  

  // const dailyCount = user.dailyCounts.find((entry) => entry.date.toDateString() === today);
  
  const dailyCount = user.dailyCounts.find((entry) =>{
    const entryString = entry.date.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});
    const entryDate = new Date(entryString);
    return entryDate.toDateString() === today.toDateString(); 
})
  
 



  if (dailyCount) {
    // If the entry for today exists, increment the count
    dailyCount.count += 1;
  } else {
    // If the entry for today doesn't exist, create a new entry
    user.dailyCounts.push({ date: today, count: 1 });
  }

  // writing rank feature
      // Fetch all users and sort them based on totalCount in descending order
  const allUsers = await userModel.find();
  const sortedUsers = allUsers.sort((a, b) => b.totalCount - a.totalCount);

  // Iterate through sorted users and assign ranks
  for (let i = 0; i < sortedUsers.length; i++) {
    const userRank = sortedUsers[i];
    userRank.rank = i + 1;
    await userRank.save(); // Save the user with the updated rank
  }


  await user.save();

  res.json({mala:user.mala,dailyCount: dailyCount,newCount:user.currCount,totalCount: user.totalCount});
});

router.get('/save', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});

  user.currCount=0;
  await user.save();

  res.json({newCount:user.currCount});
});

router.get('/lekhanHistory', async function(req,res){
  const user = await userModel.findOne({username:req.user.username});
 
  res.render('lekhanHistory',{user});
})

router.get('/impTemples', function(req,res){
  res.render('impTemples');
})

router.get('/mission', function(req,res){
  res.render('mission');
})
router.get('/forgot', function(req,res){
  res.render('forgot',{error: req.flash('error')});
})
router.post('/forgot', async function(req, res, next) {
  const { username, contact } = req.body;

  try {
    // Check if the provided username and phone number match the registered details
    const user = await userModel.findOne({ username, contact });

    if (user) {
      // If the user is found, log them in without password verification
      req.login(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/profile');
      });
    } else {
      // If no user is found, display an error message
      req.flash('error', 'Invalid username or phone number');
      return res.redirect('/forgot');
    }
  } catch (err) {
    // Handle any errors that occur during the process
    console.error('Error:', err);
    req.flash('error', 'An error occurred. Please try again later.');
    return res.redirect('/forgot');
  }
});

router.get('/about', function(req,res){
  res.render('about');
})

router.get('/glory', function(req,res){
  res.render('glory');
})

router.get('/feedback', function(req,res){
  res.render('feedback');
})

router.get('/contact', function(req,res){
  res.render('contact');
})

router.post('/register', function(req, res, next) {

  if (!req.body.username || !req.body.fullname || !req.body.password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/register');
  }

  const data = new userModel({
    username:req.body.username,
    city:req.body.city,
    contact:req.body.contact,
    name:req.body.fullname
  })
  userModel.register(data,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
  .catch(function (err) {
    // Handle registration failure (e.g., username/email already taken)
    req.flash('error', 'Please choose a different Login Id or try removing spaces from Login Id.');
    res.redirect('/');
  });
});

router.post('/login', passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile",
  failureFlash:true
}),function(req,res,next){
});

router.get('/logout',function(req,res,next){
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect('/');
  });
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

module.exports = router;
