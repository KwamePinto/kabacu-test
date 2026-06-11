const Product = require('../../models/ProductsModal')
const Checkout = require('../../models/CheckoutModal')
const User = require('../../models/UserModel')
const Cart = require('../../models/CartModal')

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


exports.courseCategory =async (req,res)=>{
try{
    const coursesProducts = await Product.find({ category: 'COURSES' }).sort({ createdAt: -1 }).limit(9);
    res.render('webview/courses-category',{
        coursesProducts
    })
}catch(erro){
    console.log(error)
}


}


exports.p2pCategory = async (req,res)=>{
try{
    
    res.render('webview/p2p-category',{
       
    })
}catch(erro){
    console.log(error)
}


}