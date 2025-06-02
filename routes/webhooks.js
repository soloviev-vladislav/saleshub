const express = require('express');
const multer = require('multer');
const router = express.Router();
const { upload } = require('../config');
const { processExcel, normalizePhone } = require('../services/excel');
const { sendToBitrix } = require('../services/bitrix');
const { loadExcelData, saveExcelData, loadWebhooks, saveWebhooks } = require('../services/storage');
const { isPositiveResponse } = require('../utils/response');
const { log } = require('../utils/logger');

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: upload.maxFileSize }
}).single('excelFile');

router.get('/', (req, res) => {
  const webhooks = loadWebhooks();
  const { fileName } = loadExcelData();

  const tableRows = Object.entries(webhooks).map(([phone, data], index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${phone}</td>
      <td>${data.title || 'N/A'}</td>
      <td>${Array.isArray(data.messages) ? data.messages.join('<br>') : 'Нет сообщений'}</td>
      <td>${data.timestamp || 'N/A'}</td>
    </tr>
  `).join('');

  const excelStatus = fileName ? `Excel-файл загружен: ${fileName}<br>` : `Excel-файл не загружен<br>`;

  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Сервер для обработки вебхуков</title>
    </head>
    <body>
      <h1>Сервер для обработки вебхуков</h1>
      ${excelStatus}
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="excelFile" accept=".xlsx">
        <input type="submit" value="Загрузить Excel">
      </form>
      <h2>Полученные вебхуки</h2>
      <table border="1">
        <tr>
          <th>ID</th>
          <th>Телефон</th>
          <th>Заголовок</th>
          <th>Сообщение</th>
          <th>Время</th>
        </tr>
        ${tableRows || '<tr><td colspan="5">Вебхуки пока не получены</td></tr>'}
      </table>
    </body>
    </html>
  `);
});

router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    const { data, fileName } = await processExcel(req.file);
    saveExcelData(data, fileName);
    res.redirect('/');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.all('/webhook', async (req, res) => {
  try {
    const phone = normalizePhone(
      req.body?.fields?.PHONE?.[0]?.VALUE ||
      req.query?.fields?.PHONE?.[0]?.VALUE ||
      'N/A'
    );
    const title = req.body?.fields?.TITLE || req.query?.fields?.TITLE || 'N/A';
    const comments = req.body?.fields?.COMMENTS || req.query?.fields?.COMMENTS || 'N/A';

    if (!phone) throw new Error('noPhone');

    const webhooks = loadWebhooks();
    if (!webhooks[phone]) {
      webhooks[phone] = { messages: [], title, timestamp: new Date().toLocaleString('ru-RU') };
    }
    webhooks[phone].messages.push(comments);
    webhooks[phone].title = title;
    webhooks[phone].timestamp = new Date().toLocaleString('ru-RU');
    saveWebhooks(webhooks);

    log(`Получен вебхук (${req.method}): phone=${phone}, title=${title}, comments=${comments}`);

    const { data: excelData } = loadExcelData();
    const match = excelData.find(row => normalizePhone(row.phone) === phone);
    if (match && isPositiveResponse(comments) && title === 'Новый лид') {
      await sendToBitrix(match, comments);
    } else {
      log(`Не отправлен в Bitrix24: ${title !== 'Новый лид' ? 'TITLE не "Новый лид"' : match ? 'Ответ не положительный' : 'Совпадений телефона в Excel не найдено'} (phone=${phone}, title=${title}, comments=${comments})`);
    }

    res.json({ message: 'Вебхук успешно получен' });
  } catch (error) {
    log(`Ошибка при обработке вебхука: ${error.message}`);
    res.status(400).send(error.message);
  }
});

module.exports = router;