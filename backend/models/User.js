import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['customer', 'owner', 'delivery'],
        required: true
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
