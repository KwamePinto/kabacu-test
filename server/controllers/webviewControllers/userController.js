const bcrypt = require('bcrypt')
const saltRounds = 10;
const UserModel = require('../../models/UserModel');
const {generateUserToken} = require('../../config/authUtils');

exports.login = async (req,res)=>{
    
    res.render('webview/login')

}

exports.loginPost = async (req,res)=>{
    
   const { email, password } = req.body;

    try{
   
    // 1. Check if user exists
    let user = await UserModel.findOne({ email });
    if (!user) {
      //req.flash('error', 'Invalid credentials');
      //return res.redirect('/');
      req.flash('error','Please Signup')
      return res.redirect('/user/login')
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid ) {
     // req.flash('error', 'Invalid credentials');
     // return res.redirect('/');
       req.flash('error','Invalid credentials')
     return res.redirect('/user/login')
    }

   

    // 4. Generate token
    const token = generateUserToken(user);

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: false, // change to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect('/')

    } catch (error) {
    console.log("Login error:", error);
    //req.flash('error', 'Something went wrong');
    return res.status(500).json({ error: error.message });
  }

   


}

exports.signup = async (req,res)=>{
    res.render('webview/register')

}

exports.signupPost = async (req,res)=>{
    try {
        const { username,  email, minerId,password } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const existing = await UserModel.findOne({ minerId });

    if (existing) {
        req.flash('error','Miner ID already taken')
         return res.redirect('/user/signup')
    }
        await UserModel.create({ username, email,minerId,role:'users', password: hashedPassword });

       res.redirect('/login')
       // res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

exports.logout = (req, res) => {
    res.clearCookie('user_token')
    res.redirect('/')
}