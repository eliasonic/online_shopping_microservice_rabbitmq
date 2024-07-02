const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib = require('amqplib')
const { v4: uuid4 } = require('uuid')
const { APP_SECRET, MESSAGE_BROKER_URL, EXCHANGE_NAME, QUEUE_NAME, SHOPPING_BINDING_KEY } = require("../config");

//Utility functions
let amqplibConnection = null

module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};

/* ============== Message Broker =============== */

// Create channel
const getChannel = async () => {
  if (amqplibConnection === null) {
      amqplibConnection = await amqplib.connect(MESSAGE_BROKER_URL)
  }
  return await amqplibConnection.createChannel()
}

module.exports.CreateChannel = async () => {
  try {
    const channel = await getChannel()
    await channel.assertExchange(EXCHANGE_NAME, 'direct', false)
    return channel
    
  } catch (err) {
    throw err
  }
}

module.exports.RPCRequest = async (RPC_QUEUE_NAME, requestPayload) => {
  const channel = await getChannel()

  const q = await channel.assertQueue('', {
      exclusive: true
  })

  const uuid = uuid4()

  channel.sendToQueue(RPC_QUEUE_NAME, Buffer.from(JSON.stringify(requestPayload)), {
      replyTo: q.queue,
      correlationId: uuid
  })   

  return new Promise((resolve, reject) => {
      const timeOut = setTimeout(() => {
          channel.close()
          resolve('API could not fulfill the request!')
      }, 8000)

      channel.consume(
          q.queue, 
          (msg) => {
              if (msg.properties.correlationId === uuid) {
                  resolve(JSON.parse(msg.content.toString()))
                  clearTimeout(timeOut)
              } else {
                  reject('No data found')
              }
          }, 
          {
            noAck: true 
          }
      )
  })
}

// Publish messages
module.exports.PublishMessage = async (channel, binding_key, message) => {
  try {
    await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message))
    console.log('Message has been sent ' + message)
  } catch (err) {
    throw err
  }
}

// Subscribe messages
module.exports.SubscribeMessage = async(channel, service) => {
  const appQueue = await channel.assertQueue(QUEUE_NAME)
  channel.bindQueue(appQueue.queue, EXCHANGE_NAME, SHOPPING_BINDING_KEY)

  channel.consume(appQueue.queue, (data) => {
    console.log('received data in Shopping Service')
    console.log(data.content.toString())
    service.SubscribeEvents(data.content.toString())
    channel.ack(data)
  })
}
