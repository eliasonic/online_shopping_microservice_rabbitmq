const { CustomerRepository } = require("../database");
const { FormateData, GeneratePassword, GenerateSalt, GenerateSignature, ValidatePassword } = require('../utils');
const { APIError, BadRequestError } = require('../utils/app-errors')


// All Business logic will be here
class CustomerService {
    constructor(){
        this.repository = new CustomerRepository();
    }

    async SignIn(userInputs){

        const { email, password } = userInputs;
        
        try {
            
            const existingCustomer = await this.repository.FindCustomer({ email});

            if(existingCustomer){
            
                const validPassword = await ValidatePassword(password, existingCustomer.password, existingCustomer.salt);
                
                if(validPassword){
                    const token = await GenerateSignature({ email: existingCustomer.email, _id: existingCustomer._id});
                    return FormateData({id: existingCustomer._id, token });
                } 
            }
    
            return FormateData(null);

        } catch (err) {
            throw new APIError('Data Not found', err)
        }

       
    }

    async SignUp(userInputs){
        
        const { email, password, phone } = userInputs;
        
        try{
            // create salt
            let salt = await GenerateSalt();
            
            let userPassword = await GeneratePassword(password, salt);
            
            const existingCustomer = await this.repository.CreateCustomer({ email, password: userPassword, phone, salt});
            
            const token = await GenerateSignature({ email: email, _id: existingCustomer._id});

            return FormateData({id: existingCustomer._id, token });

        }catch(err){
            throw new APIError('Data Not found', err)
        }

    }

    async AddNewAddress(_id,userInputs){
        
        const { street, postalCode, city,country} = userInputs;
        
        try {
            const addressResult = await this.repository.CreateAddress({ _id, street, postalCode, city,country})
            return FormateData(addressResult);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
        
    
    }

    async GetProfile(id){
        try {
            const existingCustomer = await this.repository.FindCustomerById({id});
            return FormateData(existingCustomer);
            
        } catch (err) {
            throw new APIError('Data Not found', err)
        }
    }

    async DeleteProfile(userId){
        const data = await this.repository.DeleteCustomerById(userId)

        const payload = {
            event: 'DELETE_PROFILE',
            data: { userId }
        }

        return { data, payload }
    }
}

module.exports = CustomerService;