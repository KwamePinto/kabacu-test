const Transaction = require('../../models/TransactionModel') 
const User = require('../../models/UserModel')
const Checkout = require('../../models/CheckoutModal')
 
 const adminLayouts = 'layouts/adminLayout'
const { authenticateAdminUser } = require('../../config/authMiddleware');

exports.dashboard = [authenticateAdminUser,async (req,res)=>{
    try{
           const totalUsers = await User.countDocuments();

        const totalRevenueAgg = await Transaction.aggregate([
            { $match: { status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const today = new Date();
        today.setHours(0,0,0,0);

        const todayRevenueAgg = await Transaction.aggregate([
            { 
                $match: { 
                    status: "success",
                    createdAt: { $gte: today }
                } 
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalPurchases = await Transaction.countDocuments({ status: "success" });

          let checkouts = await Checkout.find()
            .populate('product')
            .populate('user')
            .sort({ createdAt: -1 });

       
        checkouts = checkouts.map(c => {
            let productName = '';

            if (c.product?.category === "DATA") {
                productName = `${c.product.dataDetails.plan_type} (${c.product.dataDetails.plan_name})`;
            }

            if (c.product?.category === "ELECTRONIC") {
                productName = c.product.electronicDetails.itemName;
            }

            if (c.product?.category === "AUTOMOBILE") {
                productName = `${c.product.automobileDetails.brand} ${c.product.automobileDetails.model}`;
            }

            return {
                ...c._doc,
                productName
            };
        });


        res.render('adminview/dashboard',
            {
                  totalUsers,
                totalRevenue: totalRevenueAgg[0]?.total || 0,
                todayRevenue: todayRevenueAgg[0]?.total || 0,
                totalPurchases,
                checkouts,
                layout:adminLayouts
            })
    }catch(error){
        console.log(error)
    }
}]