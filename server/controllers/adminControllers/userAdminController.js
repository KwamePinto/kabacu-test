 const bcrypt = require('bcrypt')
 const saltRounds = 10;
 const UserAdminModel = require('../../models/UserAdminModel');
 const adminLayouts = 'layouts/adminLayout'
 const {generateUserAdminToken} = require('../../config/authUtils');


 exports.loginAdmin = (req,res)=>{

    try{
        res.render('adminview/users/auth-login',{layout:adminLayouts})
    }catch(error){
        console.log(error)
    }
}


exports.loginAdminPost = async (req, res) => {
  try {
    const { email, password, role } = req.body;


    // 1. Check if user exists
    let user = await UserAdminModel.findOne({ email });
    if (!user) {
      //req.flash('error', 'Invalid credentials');
      //return res.redirect('/');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
     // req.flash('error', 'Invalid credentials');
     // return res.redirect('/');
     return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Check role match
    if (user.role !== role) {
     // req.flash('error', 'Incorrect role selected');
     // return res.redirect('/');
     return res.status(401).json({ error: 'Incorrect role selected' });
    }

    // 4. Generate token
    const token = generateUserAdminToken(user);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: false, // change to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 5. Store session role
    req.session.info = {
      role: user.role
    };

    console.log(`${user.role} logged in successfully`);
    res.redirect('/admin/main/dashboard');
  


 
   //return res.status(200).json({ user });

  } catch (error) {
    console.log("Login error:", error);
    //req.flash('error', 'Something went wrong');
    return res.status(500).json({ error: error.message });
  }
};


exports.registerAdmin = (req,res)=>{

    try{
        res.render('adminview/users/auth-register',{layout:adminLayouts})
    }catch(error){
        console.log(error)
    }
}

exports.registerPost = async (req,res)=>{
    try {
        const { username,  email,role,password } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

      
          const user = await UserAdminModel.create({ username, email,role, password: hashedPassword });

       res.redirect('/admin/user/login')
    // res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

exports.logout = (req, res) => {
    res.clearCookie('admin_token')
    res.redirect('/admin/user/login')
}