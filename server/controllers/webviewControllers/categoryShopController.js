const Product = require('../../models/ProductsModal')
const Checkout = require('../../models/CheckoutModal')
const User = require('../../models/UserModel')
const Cart = require('../../models/CartModal')

const { authenticateUser } = require('../../config/authMiddleware');




exports.dataCategory =async (req, res) => {
  try {

       let perPage = 6;
    let page = req.query.page || 1; 
    let query = req.query.query || '';
    //let searchCondition = { users_id: req.userId };
    const dataProducts = await Product.find({ category: 'DATA' }).sort({ createdAt: -1 });
    const count = await Product.find({ category: 'DATA' }).countDocuments();
    console.log("count doc", count)

    // 🔥 Group by network
    const groupedProducts = {};

    dataProducts.forEach(product => {
      const network = product.dataDetails.network || 'OTHERS';

      if (!groupedProducts[network]) {
        groupedProducts[network] = [];
      }

      groupedProducts[network].push(product);
    });


    res.render('webview/data-category', {
      groupedProducts,
        current: page,
		pages: Math.ceil(count / perPage),
		hasNextPage: (page * perPage) < count,
		nextPage: parseInt(page) + 1,
		 hasPrevPage: page > 1,
		 prevPage: parseInt(page) - 1,
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