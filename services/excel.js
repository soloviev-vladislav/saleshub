const ExcelJS = require('exceljs');
const { log } = require('../utils/logger');

const processExcel = async (file) => {
  if (!file) throw new Error('fileNotUploaded');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);

  if (workbook.worksheets.length === 0) {
    log(`Ошибка: В файле ${file.originalname} отсутствуют листы`);
    throw new Error('noSheets');
  }

  const worksheet = workbook.worksheets[0];
  log(`Обработка листа: ${worksheet.name}, файл: ${file.originalname}`);

  const headers = [];
  const headerRow = worksheet.getRow(1);
  if (!headerRow || headerRow.isEmpty) {
    log(`Ошибка: Первая строка пуста в файле ${file.originalname}`);
    throw new Error('emptyHeaderRow');
  }

  headerRow.eachCell((cell) => {
    headers.push(cell.value ? cell.value.toString().trim() : 'unknown');
  });
  log(`Заголовки таблицы: ${headers.join(', ')}`);

  if (!headers.includes('phone')) {
    log(`Ошибка: Столбец 'phone' не найден в файле ${file.originalname}`);
    throw new Error('noPhoneColumn');
  }

  const data = [];
  let rowCount = 0;
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData = {};
    headers.forEach((header, index) => {
      const cellValue = row.getCell(index + 1).value;
      rowData[header] = cellValue ? cellValue.toString() : 'N/A';
    });

    if (rowData.phone && rowData.phone !== 'N/A') {
      log(`Excel строка ${rowNumber}: сырой телефон=${rowData.phone}, нормализованный=${normalizePhone(rowData.phone)}`);
      data.push(rowData);
      rowCount++;
    }
  });

  log(`Загружен Excel-файл: ${file.originalname}, строк с данными: ${rowCount}`);
  return { data, fileName: file.originalname };
};

const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('8') && cleaned.length === 11) cleaned = '7' + cleaned.slice(1);
  cleaned = cleaned.replace(/^7/, '');
  return cleaned.length >= 10 ? `+${cleaned}` : '';
};

module.exports = { processExcel, normalizePhone };