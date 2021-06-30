const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// const axios = require("axios");
const logger = require('morgan');
const cors = require('cors');
const layouts = require("express-ejs-layouts");
//const auth = require('./config/auth.js');


const mongoose = require( 'mongoose' );
//mongoose.connect( `mongodb+srv://${auth.atlasAuth.username}:${auth.atlasAuth.password}@cluster0-yjamu.mongodb.net/authdemo?retryWrites=true&w=majority`);
//mongoose.connect( 'mongodb://localhost/authDemo');
const mongoDB_URI = process.env.MONGODB_URI
mongoose.connect(mongoDB_URI)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});

const authRouter = require('./routes/authentication');
const isLoggedIn = authRouter.isLoggedIn
const loggingRouter = require('./routes/logging');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const toDoRouter = require('./routes/todo');
const toDoAjaxRouter = require('./routes/todoAjax');



const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(layouts);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(authRouter)
app.use(loggingRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/todo',toDoRouter);
app.use('/todoAjax',toDoAjaxRouter);

app.get('/profiles',
    isLoggedIn,
    async (req,res,next) => {
      try {
        res.locals.profiles = await User.find({})
        res.render('profiles')
      }
      catch(e){
        next(e)
      }
    }
  )

app.use('/publicprofile/:userId',
    async (req,res,next) => {
      try {
        let userId = req.params.userId
        res.locals.profile = await User.findOne({_id:userId})
        res.render('publicprofile')
      }
      catch(e){
        console.log("Error in /profile/userId:")
        next(e)
      }
    }
)


app.get('/profile',
    isLoggedIn,
    (req,res) => {
      res.render('profile')
    })

app.get('/editProfile',
    isLoggedIn,
    (req,res) => res.render('editProfile'))

app.post('/editProfile',
    isLoggedIn,
    async (req,res,next) => {
      try {
        let username = req.body.username
        let age = req.body.age
        req.user.username = username
        req.user.age = age
        req.user.imageURL = req.body.imageURL
        await req.user.save()
        res.redirect('/profile')
      } catch (error) {
        next(error)
      }

    })


app.use('/data',(req,res) => {
  res.json([{a:1,b:2},{a:5,b:3}]);
})

const User = require('./models/User');

app.get("/test",async (req,res,next) => {
  try{
    const u = await User.find({})
    console.log("found u "+u)
  }catch(e){
    next(e)
  }

})

app.get("/demo",
        function (req, res){res.render("demo");});


app.get("/about", (request, response) => {
  response.render("about");
});


let members = []

app.get('/germanForm', (req,res) => {
  res.locals.members = members
  res.render('germanForm')
})

app.post('/germanView',(req,res) => {
  const member = req.body.member
  const name = req.body.member
  const year = req.body.year
  const why = req.body.why
  const speaksGerman = req.body.speaksGerman
  const how = req.body.how


  members = members.concat({'member': member})
  res.locals.members = members
  res.locals.name = name
  res.locals.year = year
  res.locals.why = why
  res.locals.speaksGerman = speaksGerman
  res.locals.how = how
  res.render('germanView')
})


app.get('/weather', (req,res) => {
  const city = req.body.city
  res.locals.city = city
  res.render('weather')
})

app.post("/getWeather",
  async (req,res,next) => {
    try {
      const city = req.body.city
      const url = "https://www.metaweather.com/api/location/search/?query="+city+""
      const result = await require('axios').get(url)
      console.log(result)
      console.log('results')
      const woeid = result.data[0].woeid
      const foundCity = result.data[0].title
      console.log('woeid = ' + woeid)
      const url2 = "https://www.metaweather.com/api/location/" + woeid + "/"
      const result2 = await require('axios').get(url2)
      const data = result2.data
      res.locals.results = result.data.results
      res.locals.data= result2.data
      res.locals.city = city
      res.locals.foundCity = foundCity
      //res.json(result.data)
      res.render('getWeather')
    } catch(error){
      next(error)
    }
})




const BlogPost = require('./models/BlogPost')

app.post("/blogposts",
  isLoggedIn,
  async (req,res,next) => {
    const title = req.body.title
    const content = req.body.content
    const createdAt = req.body.createdAt
    const blogpost = req.body.blogpost
    const blogpostdoc = new BlogPost({
      title: title,
      content: content,
      createdAt: new Date(),
      userId: req.user._id,
    })
    const result = await blogpostdoc.save()
    console.log('result=')
    console.dir(result)
    res.redirect('/blogposts')
})

app.get('/blogposts', isLoggedIn,
  async (req,res,next) => {
    res.locals.blogposts = await BlogPost.find({userId:req.user._id})
    console.log('blogposts='+JSON.stringify(res.locals.blogposts.length))
    res.render('blogposts')
  })

app.get('/allblogposts', isLoggedIn,
    async (req,res,next) => {
      res.locals.blogposts = await BlogPost.find({})
      console.log('blogposts='+JSON.stringify(res.locals.blogposts.length))
      res.render('blogposts')
    })

app.get('/blogposts/last/:N', isLoggedIn,
    async (req,res,next) => {
      const N = parseInt(req.params.N)
      const blogposts = await BlogPost.find({})
      res.locals.blogposts = blogposts.slice(0,N)
      console.log('blogposts='+JSON.stringify(res.locals.blogposts.length))
      res.render('blogposts')
    })


app.get('/blogpostsremove/:blogpost_id', isLoggedIn,
  async (req,res,next) => {
    const blogpost_id = req.params.blogpost_id
    console.log(`id=${blogpost_id}`)
    await BlogPost.deleteOne({_id:blogpost_id})
    res.redirect('/blogposts')

  })

  app.get('/blogposts/clear',isLoggedIn,
  async (req,res,next) => {
    await BlogPost.deleteMany({userId:req.user._id})
    res.redirect('/blogposts')
  }
)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
