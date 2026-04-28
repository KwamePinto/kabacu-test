 const adminLayouts = 'layouts/adminLayout'
const { authenticateAdminUser } = require('../../config/authMiddleware');

const Category = require('../../models/CategoryModal');


exports.viewCategory = [authenticateAdminUser,async(req,res)=>{
    try{
    const category = await Category.find({})
    res.render('adminview/tables/category',{
        layout:adminLayouts,
        category
    })
    }catch(error){
        console.log(error)
    }
} ]

exports.createCategory =  [authenticateAdminUser,(req,res)=>{
    res.render('adminview/forms/add-category',{layout:adminLayouts})
} ]

exports.createCategoryPost =  [authenticateAdminUser,async (req,res)=>{
    try{
        const  {category_name} = req.body;
        await Category.create({category_name:category_name})

       res.redirect('/admin/category/view-category')


    }catch(error){
        console.log(error)
    }
    
} ]



