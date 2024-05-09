const { ShoppingRepository } = require("../database");
const { FormateData, RPCRequest } = require("../utils");

// All Business logic will be here
class ShoppingService {
  constructor() {
    this.repository = new ShoppingRepository();
  }

  // Cart
  async GetCart({ _id }) {
    try {
      const cartResult = await this.repository.Cart(_id)
      return FormateData(cartResult)
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async AddCartItem(customerId, productId, qty) {
    try {
      // Grab product info from Product Service via RPC
      const productResponse = await RPCRequest('PRODUCT_RPC_QUEUE', {
        type: 'VIEW_PRODUCT',
        data: productId
      })

      if (productResponse && productResponse._id) {
        const cartResult = await this.repository.ManageCart(customerId, productResponse, qty)
        return FormateData(cartResult)
      }
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async RemoveCartItem(customerId, productId) {
    try {
      const cartResult = await this.repository.ManageCart(customerId, { _id: productId }, 0, true)
      return FormateData(cartResult)
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  // Wishlist
  async GetWishlist({ _id }) {
    try {
      const { products } = await this.repository.GetWishlistByCustomerId(_id)

      if (Array.isArray(products)) {
        const ids = products.map(({_id}) => _id)
        // Perform RPC call
        const productResponse = await RPCRequest('PRODUCT_RPC_QUEUE', {
          type: 'VIEW_PRODUCTS',
          data: ids
        })
        if (productResponse) {
          return FormateData(productResponse)
        }
      }
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async AddToWishlist(customerId, productId) {
    try {
        const wishlistResult = await this.repository.ManageWishlist(customerId, productId)
        return FormateData(wishlistResult)
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async RemoveFromWishlist(customerId, productId) {
    try {
      const wishlistResult = await this.repository.ManageWishlist(customerId, productId, true)
      return FormateData(wishlistResult)
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  // Order
  async CreateOrder(userInput) {
    const { _id, txnNumber } = userInput;
    // Verify the txn number with payment logs
    try {
      const orderResult = await this.repository.CreateNewOrder(_id, txnNumber);
      return FormateData(orderResult);
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async GetOrder(order_id) {
    try {
      const order = await this.repository.Orders({ order_id });
      return FormateData(order);
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async GetOrders(customerId) {
    try {
      const orders = await this.repository.Orders({ customerId });
      return FormateData(orders);
    } catch (err) {
      throw new APIError("Data Not found", err);
    }
  }

  async DeleteProfileData(customerId) {
    return this.repository.DeleteProfileData(customerId)
  }

  async SubscribeEvents(payload){
    payload = JSON.parse(payload)
    const { event, data } =  payload;
    const { userId } = data;

    switch(event){
      case 'DELETE_PROFILE':
          await this.DeleteProfileData(userId);
          break;
      default:
          break;
    }
  }

}

module.exports = ShoppingService;
