 const adminLayouts = 'layouts/adminLayout'
const { authenticateAdminUser } = require('../../config/authMiddleware');

exports.dashboard = [authenticateAdminUser,(req,res)=>{
    try{
        res.render('adminview/dashboard',{layout:adminLayouts})
    }catch(error){
        console.log(error)
    }
}]