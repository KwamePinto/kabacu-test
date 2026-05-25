require('dotenv').config();
const path = require('path')
const express = require('express');
const bodyParser = require('body-parser')
const expressLayout = require('express-ejs-layouts')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo').default;
const session = require('express-session')
const flash = require('connect-flash');
const logger = require('morgan')
const cors = require('cors');





 const connectDB = require('./server/config/db')
// const emailQueue = require('./server/config/emailQueue');

const loadUser = require('./server/config/loadUser');
const loadCart = require('./server/config/loadCart');
const loadWallt = require('./server/config/loadWallet');
const loadAdmin = require('./server/config/loadAdmin');

const { optionalUser } = require('./server/config/authMiddleware');




const app = express();
const PORT = process.env.PORT || 2000;


connectDB()
// require('./server/config/cronJob')
// require('./server/config/cronJobOrders')

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));

// Global user loader
app.use(optionalUser);
app.use(loadUser);
//app.use(loadCart);
app.use(loadWallt);
 // ✅ applies to all pages

app.use(cors({
    origin: '*', // or use the actual WebView origin
    credentials: true
}));

app.use((req, res, next) => {
    //Giving access to all clients
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT,POST,PATCH,DELETE,GET')
        return res.status(200).json({});
    }
    next()
})



app.use(methodOverride('_method', {
    methods: ['POST', 'GET']
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    //mongoUrl: process.env.MONGODBMLAB,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    })
}));

app.use(flash());


app.use((req, res, next) => {
     res.locals.session = req.session;
    res.locals.isAuthenticated = !!req.user; // ✅ better
    console.log("user", req.user);
   // res.locals.user = req.user || null;
    //res.locals.admin = req.admin || null;
    res.locals.success_msg = req.flash('success');
     res.locals.error_msg = req.flash('error');
    next();
    // res.locals.session = req.session;
    // res.locals.isAuthenticated = req.cookies.token;
    // //res.locals.user = req.user || {};
    // console.log("user",req.user);
    // next();
});

app.use(expressLayout);
app.set('layout', './layouts/main')
app.set('view engine', 'ejs');



app.use('/', require('./server/routes/webviewRoutes/packagesRoute'));
app.use('/user', require('./server/routes/webviewRoutes/userRoute'));
app.use('/category', require('./server/routes/webviewRoutes/categoryShopRoute'));
app.use('/admin/user', require('./server/routes/adminRoutes/userAdminRoute'));
app.use('/admin/main', require('./server/routes/adminRoutes/dashboardRoute'));
app.use('/admin/category', require('./server/routes/adminRoutes/categoryRoute'));
app.use('/admin/product', require('./server/routes/adminRoutes/productsRoute'));
// app.use('/security', require('./server/routes/security'));
// app.use('/shop', require('./server/routes/shop'));
// app.use('/admin', require('./server/routes/admin'));

// app.use('/api', require('./server/routes/apis'));



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
