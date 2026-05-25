const bcrypt = require('bcrypt')
const saltRounds = 10;
const validator = require('validator')

const UserModel = require('../../models/UserModel');
const {generateUserToken} = require('../../config/authUtils');

exports.login = async (req,res)=>{
    
    res.render('webview/login')

}

exports.loginPost = async (req,res)=>{
    
  try {

        let {

            email,
            password

        } = req.body;

        // =====================================
        // SANITIZE INPUTS
        // =====================================

        email =
            email?.trim().toLowerCase();

        password =
            password?.trim();

        // =====================================
        // REQUIRED VALIDATION
        // =====================================

        if (

            !email ||

            !password

        ) {

            req.flash(
                'error',
                'All fields are required'
            );

            return res.redirect(
                '/user/login'
            );
        }

        // =====================================
        // EMAIL VALIDATION
        // =====================================

        if (

            !validator.isEmail(email)

        ) {

            req.flash(
                'error',
                'Invalid email address'
            );

            return res.redirect(
                '/user/login'
            );
        }

        // =====================================
        // FIND USER
        // =====================================

        const user =
            await UserModel.findOne({

                email
            });

        // =====================================
        // USER NOT FOUND
        // =====================================

        if (!user) {

            req.flash(
                'error',
                'Account not found. Please signup'
            );

            return res.redirect(
                '/user/login'
            );
        }

        // =====================================
        // CHECK PASSWORD
        // =====================================

        const isPasswordValid =
            await bcrypt.compare(

                password,
                user.password
            );

        if (!isPasswordValid) {

            req.flash(
                'error',
                'Invalid email or password'
            );

            return res.redirect(
                '/user/login'
            );
        }

        // =====================================
        // GENERATE TOKEN
        // =====================================

        const token =
            generateUserToken(user);

        // =====================================
        // SAVE COOKIE
        // =====================================

        res.cookie(

            'user_token',

            token,

            {

                httpOnly: true,

                secure:
                    process.env.NODE_ENV
                    === 'production',

                sameSite: 'lax',

                maxAge:
                    24 * 60 * 60 * 1000
            }
        );

        // =====================================
        // SUCCESS LOGIN
        // =====================================

        req.flash(
            'success',
            'Login successful'
        );

        return res.redirect('/');

    } catch (error) {

        console.log(
            'LOGIN ERROR:',
            error
        );

        req.flash(
            'error',
            'Something went wrong'
        );

        return res.redirect(
            '/user/login'
        );
    }
   


}

exports.signup = async (req,res)=>{
    res.render('webview/register')

}



exports.signupPost =
async (req, res) => {

    try {

        let {

            username,
            email,
            minerId,
            password,
            country

        } = req.body;

        // =====================================
        // SANITIZE INPUTS
        // =====================================

        username =
            username?.trim();

        email =
            email?.trim().toLowerCase();

        minerId =
            minerId?.trim();

        password =
            password?.trim();

        country =
            country?.trim().toLowerCase();

        // =====================================
        // REQUIRED FIELD VALIDATION
        // =====================================

        if (

            !username ||

            !email ||

            !password ||

            !country

        ) {

            req.flash(
                'error',
                'All required fields must be filled'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // USERNAME VALIDATION
        // =====================================

        if (username.length < 3) {

            req.flash(
                'error',
                'Username must be at least 3 characters'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // EMAIL VALIDATION
        // =====================================

        if (

            !validator.isEmail(email)

        ) {

            req.flash(
                'error',
                'Invalid email address'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // PASSWORD VALIDATION
        // =====================================

        if (password.length < 6) {

            req.flash(
                'error',
                'Password must be at least 6 characters'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // COUNTRY VALIDATION
        // =====================================

        const allowedCountries = [

            'ghana',
            'nigeria'
        ];

        if (

            !allowedCountries.includes(country)

        ) {

            req.flash(
                'error',
                'Invalid country selected'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // CHECK EXISTING EMAIL
        // =====================================

        const existingEmail =
            await UserModel.findOne({

                email
            });

        if (existingEmail) {

            req.flash(
                'error',
                'Email already exists'
            );

            return res.redirect(
                '/user/signup'
            );
        }

        // =====================================
        // CHECK MINER ID
        // =====================================

        if (minerId) {

            const existingMinerId =
                await UserModel.findOne({

                    minerId
                });

            if (existingMinerId) {

                req.flash(
                    'error',
                    'Miner ID already taken'
                );

                return res.redirect(
                    '/user/signup'
                );
            }
        }

        // =====================================
        // HASH PASSWORD
        // =====================================

        const hashedPassword =
            await bcrypt.hash(

                password,
                saltRounds
            );

        // =====================================
        // CREATE USER
        // =====================================

        await UserModel.create({

            username,

            email,

            minerId:
                minerId || null,

            country,

            role: 'users',

            password:
                hashedPassword
        });

        // =====================================
        // SUCCESS
        // =====================================

        req.flash(
            'success',
            'Account created successfully'
        );

        return res.redirect(
            '/user/login'
        );

    } catch (error) {

        console.log(error);

        req.flash(
            'error',
            'Something went wrong'
        );

        return res.redirect(
            '/user/signup'
        );
    }
};

exports.logout = (req, res) => {
    res.clearCookie('user_token')
    res.redirect('/')
}