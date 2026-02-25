import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'https://food-delivery-app-1atr.onrender.com';

export const socket = io(URL, {
    autoConnect: false
});
