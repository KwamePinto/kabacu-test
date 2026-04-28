const express = require('express')
const router = express.Router()


const getDashboard = require('../../controllers/adminControllers/dashboardController')

router.get('/dashboard',getDashboard.dashboard)


module.exports = router