const Product = require('../../models/ProductsModal')
const Checkout = require('../../models/CheckoutModal')
const User = require('../../models/UserModel')
const Cart = require('../../models/CartModal')
const Transaction = require('../../models/TransactionModel')
const CoursePurchase = require('../../models/CoursePurchaseModel')
const axios = require('axios')

const { authenticateUser } = require('../../config/authMiddleware');




exports.dataCategory = async (req, res) => {
  try {
    const perPage  = 12;
    const reqNet   = (req.query.network || '').toUpperCase();
    const reqPage  = parseInt(req.query.page) || 1;

    /* Fetch all DATA products sorted: network A-Z, newest first within each */
    const all = await Product.find({ category: 'DATA' })
      .sort({ 'dataDetails.network': 1, createdAt: -1 });

    /* Group every product by network */
    const allGrouped = {};
    all.forEach(p => {
      const net = (p.dataDetails.network || 'OTHERS').toUpperCase();
      if (!allGrouped[net]) allGrouped[net] = [];
      allGrouped[net].push(p);
    });

    /* Build per-network page slices + pagination metadata */
    const groupedProducts = {};
    const netPagination   = {};

    for (const net of Object.keys(allGrouped)) {
      const items = allGrouped[net];
      const pages = Math.ceil(items.length / perPage) || 1;
      /* Only the requested network uses the requested page; others default to 1 */
      const page  = Math.min(Math.max(reqNet === net ? reqPage : 1, 1), pages);

      groupedProducts[net] = items.slice((page - 1) * perPage, page * perPage);
      netPagination[net]   = { pages, current: page, hasNext: page < pages, hasPrev: page > 1 };
    }

    const networks      = Object.keys(groupedProducts);
    const activeNetwork = reqNet && networks.includes(reqNet) ? reqNet : (networks[0] || '');

    res.render('webview/data-category', {
      groupedProducts,
      netPagination,
      activeNetwork,
    });

  } catch (error) {
    console.log(error);
  }
}

exports.eletronicCategory = async (req,res)=>{
try{
    const electronicProducts = await Product.find({ category: 'ELECTRONICS' }).sort({ createdAt: -1 }).limit(9);
    res.render('webview/electronic-category',{
        electronicProducts
    })
}catch(erro){
    console.log(error)
}


}

exports.automobileCategory = async (req,res)=>{
try{
    const automobileProducts = await Product.find({ category: 'AUTOMOBILE' }).sort({ createdAt: -1 }).limit(9);
    res.render('webview/automobile-category',{
        automobileProducts
    })
}catch(erro){
    console.log(error)
}


}


exports.courseCategory = async (req, res) => {
  const apiUrl = process.env.COURSES_API_URL || 'http://localhost:5000';
  let courses  = [];
  let apiError = false;

  try {
    const response = await axios.get(`${apiUrl}/api/public/courses`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = response.data;
    courses = Array.isArray(data)          ? data
            : Array.isArray(data.courses)  ? data.courses
            : Array.isArray(data.data)     ? data.data
            : [];
  } catch (err) {
    console.error('[courseCategory]', err.message);
    apiError = true;
  }

  res.render('webview/courses-category', { coursesApiUrl: apiUrl, courses, apiError });
}


exports.courseDetail = async (req, res) => {
  try {
    const apiUrl = process.env.COURSES_API_URL || 'http://localhost:5000';
    const response = await axios.get(`${apiUrl}/api/public/courses/${req.params.id}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = response.data;
    const course = data.course || data.data || (typeof data === 'object' && !Array.isArray(data) ? data : null);
    if (!course) return res.redirect('/category/course-category');

    let walletBalance = null;
    let alreadyPurchased = false;

    if (req.user) {
      const user = await User.findById(req.user.id).populate('wallet');
      if (user?.wallet) walletBalance = user.wallet.balances?.NAIRA || 0;
      const email = user?.email?.toLowerCase().trim();
      if (email) {
        const existing = await CoursePurchase.findOne({ email, courseId: String(req.params.id) });
        alreadyPurchased = !!existing;
      }
    }

    res.render('webview/course-detail', {
      course,
      coursesApiUrl: apiUrl,
      walletBalance,
      alreadyPurchased,
      cskillshubLoginUrl: process.env.CSKILLSHUB_LOGIN_URL || 'http://localhost:3000/login',
    });
  } catch (err) {
    console.error(err);
    res.redirect('/category/course-category');
  }
};

exports.coursePurchase = async (req, res) => {
  const courseId = req.params.id;
  const redirectBase = `/category/course/${courseId}`;

  try {
    const apiUrl = process.env.COURSES_API_URL || 'http://localhost:5000';

    const response = await axios.get(`${apiUrl}/api/public/courses/${courseId}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = response.data;
    const course = data.course || data.data || (typeof data === 'object' && !Array.isArray(data) ? data : null);
    if (!course) return res.redirect('/category/course-category');

    const user = await User.findById(req.user.id).populate('wallet');
    if (!user) return res.redirect('/user/login');

    const email = user.email.toLowerCase().trim();
    const price = Number(course.price) || 0;
    const isFree = price === 0;

    const existing = await CoursePurchase.findOne({ email, courseId: String(courseId) });
    if (existing) return res.redirect(`${redirectBase}?already=1`);

    if (isFree) {
      await CoursePurchase.create({
        email,
        user: user._id,
        courseId: String(courseId),
        courseTitle: course.title || '',
        price: 0,
        free: true,
      });
      return res.redirect(`${redirectBase}?enrolled=1`);
    }

    // Paid — wallet deduction
    const wallet = user.wallet;
    if (!wallet || (wallet.balances?.NAIRA || 0) < price) {
      return res.redirect(`${redirectBase}?insufficient=1`);
    }

    wallet.balances.NAIRA -= price;
    await wallet.save();

    const ref = 'CRS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    try {
      await CoursePurchase.create({
        email,
        user: user._id,
        courseId: String(courseId),
        courseTitle: course.title || '',
        price,
        free: false,
        transactionRef: ref,
      });
    } catch (createErr) {
      wallet.balances.NAIRA += price;
      await wallet.save();
      throw createErr;
    }

    await Transaction.create({
      user: user._id,
      amount: price,
      walletType: 'NAIRA',
      paymentMethod: 'Wallet',
      status: 'success',
      reference: ref,
    });

    return res.redirect(`${redirectBase}?enrolled=1`);

  } catch (err) {
    console.error(err);
    res.redirect(`${redirectBase}?error=1`);
  }
};

exports.p2pCategory = async (req,res)=>{
try{
    
    res.render('webview/p2p-category',{
       
    })
}catch(erro){
    console.log(error)
}


}