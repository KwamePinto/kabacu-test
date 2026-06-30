const Transaction = require('../../models/TransactionModel');
const TopUp       = require('../../models/TopUpModal');
const User        = require('../../models/UserModel');
const Conversion  = require('../../models/ConversionModal');

const adminLayouts = 'layouts/adminLayout';
const { authenticateAdminUser } = require('../../config/authMiddleware');

exports.dashboard = [authenticateAdminUser, async (req, res) => {
    try {
        const now      = new Date();
        const today    = new Date(now); today.setHours(0, 0, 0, 0);
        const thisWeek = new Date(now); thisWeek.setDate(now.getDate() - 7);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYear  = new Date(now.getFullYear(), 0, 1);

        const [
            totalUsers,
            newUsersToday,
            verifiedUsers,
            totalRevenueAgg,
            todayRevenueAgg,
            weeklyRevenueAgg,
            monthlyRevenueAgg,
            yearlyRevenueAgg,
            totalPurchases,
            pendingTopUps,
            completedTopUps,
            totalConversions,
            recentTransactions
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ isVerified: true }),
            Transaction.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { status: 'success', createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { status: 'success', createdAt: { $gte: thisWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { status: 'success', createdAt: { $gte: thisMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                { $match: { status: 'success', createdAt: { $gte: thisYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.countDocuments({ status: 'success' }),
            TopUp.countDocuments({ status: 'PENDING' }),
            TopUp.countDocuments({ status: 'COMPLETED' }),
            Conversion.countDocuments(),
            Transaction.find({ status: 'success' })
                .populate('user', 'username email')
                .populate('product')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        res.render('adminview/dashboard', {
            totalUsers,
            newUsersToday,
            verifiedUsers,
            totalRevenue:   totalRevenueAgg[0]?.total   || 0,
            todayRevenue:   todayRevenueAgg[0]?.total   || 0,
            weeklyRevenue:  weeklyRevenueAgg[0]?.total  || 0,
            monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
            yearlyRevenue:  yearlyRevenueAgg[0]?.total  || 0,
            totalPurchases,
            pendingTopUps,
            completedTopUps,
            totalConversions,
            recentTransactions,
            layout: adminLayouts
        });
    } catch (error) {
        console.log('DASHBOARD ERROR:', error);
    }
}];