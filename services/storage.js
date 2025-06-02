const fs = require('fs');
const { dataPath } = require('../config');
const { log } = require('../utils/logger');

const loadExcelData = () => {
  try {
    if (fs.existsSync(dataPath.excel)) {
      const { data, fileName } = JSON.parse(fs.readFileSync(dataPath.excel, 'utf8'));
      console.log(`Загружены данные из excel_data.json, строк: ${data.length}, файл: ${fileName}`);
      return { data: data || [], fileName: fileName || null };
    }
  } catch (error) {
    log(`Ошибка при загрузке excel_data.json: ${error.message}`);
  }
  return { data: [], fileName: null };
};

const saveExcelData = (data, fileName) => {
  try {
    fs.writeFileSync(dataPath.excel, JSON.stringify({ data, fileName }, null, 2));
    log(`Сохранены данные в excel_data.json, строк: ${data.length}, файл: ${fileName}`);
  } catch (error) {
    log(`Ошибка при сохранении excel_data.json: ${error.message}`);
  }
};

const loadWebhooks = () => {
  try {
    if (fs.existsSync(dataPath.webhooks)) {
      const raw = JSON.parse(fs.readFileSync(dataPath.webhooks, 'utf8'));
      if (Array.isArray(raw)) {
        const webhooks = {};
        raw.forEach(hook => {
          if (hook.phone && hook.comments) {
            webhooks[hook.phone] = {
              messages: [hook.comments],
              title: hook.title || 'N/A',
              timestamp: hook.timestamp || new Date().toLocaleString('ru-RU')
            };
          }
        });
        saveWebhooks(webhooks);
        console.log(`Преобразован старый формат webhooks.json, номеров: ${Object.keys(webhooks).length}`);
        return webhooks;
      }
      console.log(`Загружены вебхуки из webhooks.json, номеров: ${Object.keys(raw).length}`);
      return raw || {};
    }
  } catch (error) {
    log(`Ошибка при загрузке webhooks.json: ${error.message}`);
  }
  return {};
};

const saveWebhooks = (webhooks) => {
  try {
    fs.writeFileSync(dataPath.webhooks, JSON.stringify(webhooks, null, 2));
    log(`Сохранены вебхуки в webhooks.json, номеров: ${Object.keys(webhooks).length}`);
  } catch (error) {
    log(`Ошибка при сохранении webhooks.json: ${error.message}`);
  }
};

module.exports = { loadExcelData, saveExcelData, loadWebhooks, saveWebhooks };