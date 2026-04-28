const express = require('express')
const router = express.Router()


const getAdminUsers = require('../../controllers/adminControllers/userAdminController')

router.get('/register',getAdminUsers.registerAdmin)

router.post('/register',getAdminUsers.registerPost)

router.get('/login',getAdminUsers.loginAdmin)

router.post('/login',getAdminUsers.loginAdminPost)

router.get('/logout',getAdminUsers.logout)


module.exports = router