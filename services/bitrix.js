const axios = require('axios');
const { bitrixUrl } = require('../config');
const { log } = require('../utils/logger');
const { normalizePhone } = require('./excel');

const isValidEmail = (email) => {
  if (!email || email === 'N/A') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sendToBitrix = async (excelRow, comments) => {
  const phone = normalizePhone(excelRow.phone);
  if (!phone) {
    log(`Ошибка: Неверный формат телефона для Bitrix24 (phone=${excelRow.phone})`);
    throw new Error('invalidPhone');
  }

  const bitrixData = {
    FIELDS: {
      TITLE: excelRow.company_name && excelRow.company_name !== 'N/A' ? `Подписка ${excelRow.company_name}` : 'Подписка',
      NAME: excelRow.first_name && excelRow.first_name !== 'N/A' ? excelRow.first_name : '',
      SECOND_NAME: excelRow.middle_name && excelRow.middle_name !== 'N/A' ? excelRow.middle_name : '',
      LAST_NAME: excelRow.last_name && excelRow.last_name !== 'N/A' ? excelRow.last_name : '',
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      COMMENTS: comments !== 'N/A' ? comments : '',
      SOURCE_DESCRIPTION: excelRow.url && excelRow.url !== 'N/A' ? excelRow.url : 'не указано',
      COMPANY_TITLE: excelRow.company_name && excelRow.company_name !== 'N/A' ? excelRow.company_name : '',
      EMAIL: isValidEmail(excelRow.email) ? [{ VALUE: excelRow.email, VALUE_TYPE: 'WORK' }] : undefined
    }
  };

  Object.keys(bitrixData.FIELDS).forEach(key => {
    if (bitrixData.FIELDS[key] === undefined) delete bitrixData.FIELDS[key];
  });

  log(`Формируем FIELDS для Bitrix24: ${JSON.stringify(bitrixData.FIELDS)}`);

  try {
    const response = await axios.post(bitrixUrl, bitrixData);
    log(`Отправлен в Bitrix24, статус: ${response.status}, ответ: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response
      ? `Ошибка при отправке в Bitrix24: Статус ${error.response.status}, ответ: ${JSON.stringify(error.response.data)}`
      : `Ошибка при отправке в Bitrix24: ${error.message}`;
    log(errorMessage);
    throw error;
  }
};

module.exports = { sendToBitrix };