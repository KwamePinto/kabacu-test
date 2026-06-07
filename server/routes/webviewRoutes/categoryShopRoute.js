const express = require('express')
const router = express.Router()

const getCategory = require('../../controllers/webviewControllers/categoryShopController')



router.get('/data-category',getCategory.dataCategory)

router.get('/electronic-category',getCategory.eletronicCategory)

router.get('/automobile-category',getCategory.automobileCategory)

router.get('/course-category',getCategory.courseCategory)

router.get('/p2p-category',getCategory.p2pCategory)




module.exports = router;