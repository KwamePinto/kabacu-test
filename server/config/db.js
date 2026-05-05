const mongoose = require('mongoose');

const connectMongoDB = async () => {

	try{
		mongoose.set('strictQuery', false)

		const conn = await mongoose.connect(process.env.MONGO_URI)
		//const conn = await mongoose.connect(process.env.MONGODBMLAB)
		console.log(`Database connected: ${conn.connection.host}`)

	}catch(error){
		console.log(error)
	}
}

module.exports = connectMongoDB;


/**from the above no OTP is needed, and no external api, and also kindly add the controllers and routes for the convention logic */