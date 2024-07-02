const { CartModel, OrderModel, WishlistModel } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { APIError, BadRequestError, STATUS_CODES } = require('../../utils/app-errors')
const _ = require('lodash')

//Dealing with data base operations
class ShoppingRepository {
    async CreateNewOrder(customerId, txnId){
        try{
            const cart = await CartModel.findOne({ customerId });    
            if(cart){                
                let amount = 0;        
                let cartItems = cart.items;    
                if(cartItems.length > 0){
                    cartItems.map(item => {
                        amount += parseInt(item.product.price) *  parseInt(item.unit);   
                    });
       
                    const orderId = uuidv4();        
                    const order = new OrderModel({
                        orderId,
                        customerId,
                        amount,
                        txnId,
                        status: 'received',
                        items: cartItems
                    })
        
                    cart.items = [];                    
                    const orderResult = await order.save();    
                    await cart.save();   
                    return orderResult;
                }
            }    
          return {}
        }catch(err){
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Category')
        }
    }

    async Orders({ customerId, order_id }){
        try{
            if (customerId) {
                return OrderModel.find({ customerId })
            } else {
                return OrderModel.findOne({ _id: order_id })
            }
        }catch(err){
            throw new APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Orders')
        }
    }

    // Cart
    async Cart(customerId){
        try {
            const cart = await CartModel.findOne({ customerId })

            if (cart) {
                return cart
            }

            throw new Error('Data not found')
        } catch (err) {
            throw err
        }
    }
 
    async ManageCart(customerId, product, qty, isRemove) {
        try {
            const cart = await CartModel.findOne({ customerId });
    
            if (cart) {
                if (isRemove) {
                    const cartItems = _.filter(cart.items, (item) => {
                        return item.product._id !== product._id
                    })
                    cart.items = cartItems
                } else {
                    const cartIndex = _.findIndex(cart.items, { 
                        product: { _id: product._id }
                    })
                    if (cartIndex > -1) {
                        cart.items[cartIndex].unit = qty
                    } else {
                        cart.items.push({ product: {...product}, unit: qty })
                    }
                }
                return await cart.save()
            } else{
                return await CartModel.create({
                    customerId,
                    items: [{ product: {...product}, unit: qty }]
                })
            }

        } catch (err) {
            throw new APIError(
                "API Error",
                STATUS_CODES.INTERNAL_ERROR,
                "Unable to Modify Cart"
            );
        }
    }

    // Wishlist
    async GetWishlistByCustomerId(customerId){
        try {
            const wishlist = await WishlistModel.findOne({ customerId })
            if (wishlist) {
                return wishlist
            }
            throw new Error('Data not found')
        } catch (err) {
            throw err
        }
    }
 
    async ManageWishlist(customerId, productId, isRemove) {
        try {
            const wishlist = await WishlistModel.findOne({ customerId });
   
            if (wishlist) {
                if (isRemove) {
                    const products = _.filter(wishlist.products, (product) => {
                        return product._id !== productId
                    })
                    // const products = wishlist.products.filter(({ _id }) => {
                    //     return _id !== productId
                    // })
                    
                    wishlist.products = products
                } else {
                    const wishlistIndex = _.findIndex(wishlist.products, { 
                        _id: productId
                    })
                    if (wishlistIndex < 0) {
                        wishlist.products.push({ _id: productId })
                    } 
                }
                return await wishlist.save()
            } else{
                return await WishlistModel.create({
                    customerId,
                    products: [{ _id: productId }]
                })
            }

        } catch (err) {
            throw new APIError(
                "API Error",
                STATUS_CODES.INTERNAL_ERROR,
                "Unable to Modify Cart"
            );
        }
    }

    async DeleteProfileData(customerId) {
        return Promise.all([
            CartModel.findOneAndDelete({ customerId }),
            WishlistModel.findOneAndDelete({ customerId })
        ])
    }
}

module.exports = ShoppingRepository;