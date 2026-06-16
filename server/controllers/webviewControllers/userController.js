const bcrypt = require('bcrypt')
const saltRounds = 10;
const validator = require('validator')
const countries = require("i18n-iso-countries");

const UserModel = require('../../models/UserModel');
const {generateUserToken} = require('../../config/authUtils');
const emailService = require('../../utils/emailService');

exports.login = async (req,res)=>{

    res.render('webview/login', { hideHeader: true })

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
        // CHECK IF EMAIL IS VERIFIED
        // =====================================
        if (user.isVerified === false) {
            req.session.pendingVerificationEmail = email;
            req.flash('error', 'Your email is not verified yet. Please enter the OTP code sent to your email.');
            return res.redirect('/user/verify-otp');
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
    countries.registerLocale(
  require("i18n-iso-countries/langs/en.json")
);

const countryNames = countries.getNames("en");

console.log(countryNames);
    res.render('webview/register', { countryNames, hideHeader: true })

}



exports.signupPost =
async (req, res) => {

    try {

        let {

            username,
            email,
            phone_number,
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

        let parsedMinerId = null;
        if (minerId) {
            const isNum = /^\d+$/.test(minerId);
            if (!isNum || minerId.length > 11) {
                req.flash(
                    'error',
                    'Miner ID must be a number with a maximum of 11 digits'
                );

                return res.redirect(
                    '/user/signup'
                );
            }
            parsedMinerId = Number(minerId);

            const existingMinerId =
                await UserModel.findOne({
                    minerId: parsedMinerId
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
        // GENERATE OTP & CREATE UNVERIFIED USER
        // =====================================

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await UserModel.create({

            username,

            email,
            phone_number,

            minerId:
                parsedMinerId,

            country,

            role: 'users',

            password:
                hashedPassword,

            isVerified: false,
            verificationToken: otp,
            verificationTokenExpires: Date.now() + 15 * 60 * 1000
        });

        // =====================================
        // SEND OTP EMAIL
        // =====================================
        await emailService.sendOTP(email, otp);

        req.session.pendingVerificationEmail = email;

        // =====================================
        // SUCCESS
        // =====================================

        req.flash(
            'success',
            'Registration successful! Please enter the OTP code sent to your email.'
        );

        return res.redirect(
            '/user/verify-otp'
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

exports.resetPassword = async (req, res) => {
  res.render('webview/reset-password', { hideHeader: true });
};

exports.resetPasswordPost = async (req, res) => {
  try {
    let { email, currentPassword, newPassword, confirmPassword } = req.body;

    email           = email?.trim().toLowerCase();
    currentPassword = currentPassword?.trim();
    newPassword     = newPassword?.trim();
    confirmPassword = confirmPassword?.trim();

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/user/reset-password');
    }

    if (!validator.isEmail(email)) {
      req.flash('error', 'Invalid email address');
      return res.redirect('/user/reset-password');
    }

    if (newPassword.length < 6) {
      req.flash('error', 'New password must be at least 6 characters');
      return res.redirect('/user/reset-password');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/user/reset-password');
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      req.flash('error', 'No account found with that email address');
      return res.redirect('/user/reset-password');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/user/reset-password');
    }

    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    req.flash('success', 'Password updated successfully. Please sign in with your new password.');
    return res.redirect('/user/login');

  } catch (error) {
    console.log('RESET PASSWORD ERROR:', error);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/user/reset-password');
  }
};

exports.verifyOTP = async (req, res) => {
  const email = req.session.pendingVerificationEmail;
  if (!email) {
    req.flash('error', 'No pending verification. Please register first.');
    return res.redirect('/user/signup');
  }
  res.render('webview/otp', { email, hideHeader: true });
};

exports.verifyOTPPost = async (req, res) => {
  try {
    const email = req.session.pendingVerificationEmail;
    if (!email) {
      req.flash('error', 'No pending verification. Please register first.');
      return res.redirect('/user/signup');
    }

    const { otp } = req.body;
    if (!otp) {
      req.flash('error', 'OTP is required');
      return res.redirect('/user/verify-otp');
    }

    const user = await UserModel.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Invalid or expired OTP code.');
      return res.redirect('/user/verify-otp');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    delete req.session.pendingVerificationEmail;

    req.flash('success', 'Email verified successfully! Please log in.');
    return res.redirect('/user/login');

  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/user/verify-otp');
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const email = req.session.pendingVerificationEmail;
    if (!email) {
      req.flash('error', 'No pending verification. Please register first.');
      return res.redirect('/user/signup');
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/user/signup');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = otp;
    user.verificationTokenExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await emailService.sendOTP(email, otp);

    req.flash('success', 'A new OTP code has been sent to your email.');
    return res.redirect('/user/verify-otp');

  } catch (error) {
    console.error('RESEND OTP ERROR:', error);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/user/verify-otp');
  }
};