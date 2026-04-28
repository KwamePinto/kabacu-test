const Product = require('../../models/ProductsModal')
const Checkout = require('../../models/CheckoutModal')
const User = require('../../models/UserModel')
const Cart = require('../../models/CartModal')

const { authenticateUser } = require('../../config/authMiddleware');




exports.dataCategory = [authenticateUser,async (req,res)=>{
try{
    const dataProducts = await Product.find({ category: 'DATA' }).limit(9);
    res.render('webview/data-category',{
        dataProducts
    })
}catch(erro){
    console.log(error)
}


}]

exports.eletronicCategory = [authenticateUser,async (req,res)=>{
try{
    const electronicProducts = await Product.find({ category: 'ELECTRONICS' }).limit(9);
    res.render('webview/electronic-category',{
        electronicProducts
    })
}catch(erro){
    console.log(error)
}


}]

exports.automobileCategory = [authenticateUser,async (req,res)=>{
try{
    const automobileProducts = await Product.find({ category: 'AUTOMOBILE' }).limit(9);
    res.render('webview/automobile-category',{
        automobileProducts
    })
}catch(erro){
    console.log(error)
}


}]


exports.courseCategory = [authenticateUser,async (req,res)=>{
try{
    const coursesProducts = await Product.find({ category: 'COURSES' }).limit(9);
    res.render('webview/courses-category',{
        coursesProducts
    })
}catch(erro){
    console.log(error)
}


}]