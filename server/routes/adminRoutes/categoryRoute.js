const express = require('express')
const router = express.Router()


const getCategory = require('../../controllers/adminControllers/categoryController')

router.get('/view-category',getCategory.viewCategory)

router.get('/create-category',getCategory.createCategory)

router.post('/add-category',getCategory.createCategoryPost)

module.exports = router;