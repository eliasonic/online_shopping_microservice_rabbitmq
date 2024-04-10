const express = require('express');

const app = express();

const PORT = 8003

app.use(express.json())

app.use('/', (req, res) => {
    return res.status(200).json({ message: 'Welcome to shopping' })
})

app.listen(PORT, () => {
    console.log(`Shopping listening to port ${PORT}`);
})
