const express = require('express');
const { port } = require('./config');
const errors = require('./errors.json');
const webhooksRouter = require('./routes/webhooks');
const { log } = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', webhooksRouter);

// Обработка ошибок
app.use((err, req, res, next) => {
  log(`Ошибка: ${err.message}`);
  const errorMessage = errors[err.message] || errors.serverError;
  res.status(500).send(errorMessage);
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});