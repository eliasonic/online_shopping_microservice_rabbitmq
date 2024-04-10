const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    email: String,
    password: String,
    salt: String,
    phone: String,
    address:[
        { type: Schema.Types.ObjectId, ref: 'address', require: true }
    ],
    cart: [
        {
          product: { 
            _id: String,
            name: String,
            desc: String,
            banner: String,
            type: String,
            unit: Number,
            price: Number,
            available: Boolean,
            suplier: String
          },
          unit: { type: Number, require: true}
        }
    ],
    wishlist:[
        { 
            _id: String,
            name: String,
            desc: String,
            banner: String,
            type: String,
            unit: Number,
            price: Number,
            available: Boolean,
            suplier: String
        }
    ],
    orders: [ 
        {
            _id: String,
            orderId: String,
            customerId: String,
            amount: Number,
            status: String,
            txnId: String,
            items: [
                {   
                    product: { 
                        _id: String,
                        name: String,
                        desc: String,
                        banner: String,
                        type: String,
                        unit: Number,
                        price: Number,
                        available: Boolean,
                        suplier: String
                      },
                    unit: { type: Number, require: true} 
                }
            ]
        }
    ]
},{
    toJSON: {
        transform(doc, ret){
            delete ret.password;
            delete ret.salt;
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports =  mongoose.model('customer', CustomerSchema);