var express = require('express');
var router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('./users')

passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {error: req.flash('error')});
});

router.get('/register', function(req, res, next) {
  res.render('register', {error: req.flash('error')});
});

router.get('/profile', isLoggedIn,function(req, res, next) {
  res.render('profile',{user:req.user});
});

router.get('/increment', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});

  user.currCount +=1;
  user.totalCount+=1;
  await user.save();

  res.json({newCount:user.currCount,totalCount: user.totalCount});
});

router.get('/save', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username:req.user.username});

  user.prevCount =user.currCount;
  user.currCount=0;
  await user.save();

  res.json({newCount:user.currCount,prevCount: user.prevCount});
});

router.post('/register', function(req, res, next) {

  if (!req.body.username || !req.body.fullname || !req.body.email || !req.body.password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/register');
  }

  const data = new userModel({
    username:req.body.username,
    email:req.body.email,
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
