const mongoose = require('mongoose');

const connectMongoDB = async () => {

	try{
		mongoose.set('strictQuery', false)

		const conn = await mongoose.connect(process.env.MONGO_URI)
		console.log(`Database connected: ${conn.connection.host}`)

		// Drop the non-sparse minerId index if it exists so Mongoose can
		// recreate it as sparse (allows multiple documents with minerId: null).
		try {
			await conn.connection.collection('users').dropIndex('minerId_1');
			console.log('Dropped stale minerId_1 index — will be recreated as sparse');
		} catch (e) {
			// Index doesn't exist or already correct — nothing to do
		}

	}catch(error){
		console.log(error)
	}
}

module.exports = connectMongoDB;


/**from the above no OTP is needed, and no external api, and also kindly add the controllers and routes for the convention logic */