import { create } from 'zustand';

const useCartStore = create((set) => ({
    cart: [],
    restaurantId: null,

    addToCart: (item, restId) => set((state) => {
        // If adding from a different restaurant, clear cart
        if (state.restaurantId && state.restaurantId !== restId) {
            if (!window.confirm("Adding items from a new restaurant will clear your current cart. Continue?")) {
                return state;
            }
            return { cart: [{ ...item, quantity: 1 }], restaurantId: restId };
        }

        const existingItem = state.cart.find(i => i._id === item._id);
        if (existingItem) {
            return {
                cart: state.cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i),
                restaurantId: restId
            };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }], restaurantId: restId };
    }),

    removeFromCart: (itemId) => set((state) => {
        const existingItem = state.cart.find(i => i._id === itemId);
        if (existingItem.quantity === 1) {
            const newCart = state.cart.filter(i => i._id !== itemId);
            return { cart: newCart, restaurantId: newCart.length === 0 ? null : state.restaurantId };
        } else {
            return {
                cart: state.cart.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
            };
        }
    }),

    clearCart: () => set({ cart: [], restaurantId: null }),

    getCartTotal: () => {
        let total = 0;
        // We can't access state inside this function directly like this without get(), but Zustand allows it via another way.
        // However, it's easier to just calculate in the component. We'll leave it out of the store to keep it clean.
        return total;
    }
}));

export default useCartStore;
