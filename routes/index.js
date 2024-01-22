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

  res.render('index', {userCount,error: req.flash('error')});
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


  // Find or create the daily count for today
  const today = new Date().toDateString();  // new date object bana rha current date ka

  const dailyCount = user.dailyCounts.find((entry) => entry.date.toDateString() === today); // date jo barabar hai aaj ke 


  if (dailyCount) {
    // If the entry for today exists, increment the count
    dailyCount.count += 1;
  } else {
    // If the entry for today doesn't exist, create a new entry
    user.dailyCounts.push({ date: new Date(), count: 1 });
  }

  await user.save();

  res.json({mala:user.mala,dailyCount: dailyCount,newCount:user.currCount,totalCount: user.totalCount});
});

router.get('/save', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});

  user.prevCount =user.currCount;
  user.currCount=0;
  await user.save();

  res.json({newCount:user.currCount,prevCount: user.prevCount});
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
    req.flash('error', 'Registration failed. Please choose a different username or email.');
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
