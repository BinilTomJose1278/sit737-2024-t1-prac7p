// Required modules
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');

// Express app setup
const app = express();
const port = 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'calculator-microservice' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

// MongoDB connection
const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const host = process.env.MONGO_HOST;

const uri = `mongodb://${user}:${pass}@${host}:27017/?authSource=admin`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info("✅ MongoDB connected"))
  .catch(err => logger.error("❌ MongoDB connection error:", err));

// MongoDB model
const Calculation = mongoose.model('Calculation', {
  operation: String,
  num1: Number,
  num2: Number,
  result: Number,
  timestamp: { type: Date, default: Date.now }
});

// Logging incoming and outgoing HTTP requests
app.use((req, res, next) => {
  const { method, url, headers, ip } = req;
  logger.info({ message: 'Incoming Request', method, url, ip, headers });

  const originalSend = res.send;
  res.send = function (body) {
    logger.info({ message: 'Outgoing Response', statusCode: res.statusCode, body });
    originalSend.call(this, body);
  };

  next();
});

// Core calculator logic
const calculate = (req, res, operation) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);
  let result;

  switch (operation) {
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
    case 'power':
    case 'modulo':
      if (isNaN(num1) || isNaN(num2)) {
        logger.error('Invalid input: num1 or num2 is not a number');
        return res.status(400).json({ error: 'Both num1 and num2 must be numbers.' });
      }
      break;
    case 'sqrt':
      if (isNaN(num1)) {
        logger.error('Invalid input: num1 is not a number');
        return res.status(400).json({ error: 'num1 must be a number.' });
      }
      break;
  }

  switch (operation) {
    case 'add':
      result = num1 + num2;
      break;
    case 'subtract':
      result = num1 - num2;
      break;
    case 'multiply':
      result = num1 * num2;
      break;
    case 'divide':
      if (num2 === 0) return res.status(400).json({ error: 'Cannot divide by zero.' });
      result = num1 / num2;
      break;
    case 'power':
      result = Math.pow(num1, num2);
      break;
    case 'modulo':
      if (num2 === 0) return res.status(400).json({ error: 'Cannot perform modulo by zero.' });
      result = num1 % num2;
      break;
    case 'sqrt':
      if (num1 < 0) return res.status(400).json({ error: 'Cannot get the square root of a negative number.' });
      result = Math.sqrt(num1);
      break;
  }

  logger.info(`Operation: ${operation}, Inputs: num1=${num1}, num2=${num2}, Result: ${result}`);
  res.json({ result });

  // Save to MongoDB
  const calc = new Calculation({
    operation,
    num1,
    num2: operation !== 'sqrt' ? num2 : undefined,
    result
  });

  calc.save()
    .then(() => logger.info("📥 Calculation saved to DB"))
    .catch(err => logger.error("❌ Error saving to DB:", err));
};

// Routes
app.get('/add', (req, res) => calculate(req, res, 'add'));
app.get('/subtract', (req, res) => calculate(req, res, 'subtract'));
app.get('/multiply', (req, res) => calculate(req, res, 'multiply'));
app.get('/divide', (req, res) => calculate(req, res, 'divide'));
app.get('/power', (req, res) => calculate(req, res, 'power'));
app.get('/modulo', (req, res) => calculate(req, res, 'modulo'));
app.get('/sqrt', (req, res) => calculate(req, res, 'sqrt'));

// Start server
app.listen(port, () => {
  logger.info(`📡 Calculator microservice running on http://localhost:${port}`);
});
