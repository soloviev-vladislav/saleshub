const { log } = require('./logger');

const negativePatterns = [
  /нет/, /не\s*интересно/, /неинтересно/, /взяли/, /уже\s*взяли/,
  /удаленно/, /удалённо/, /штат(ный|ные)?/, /не\s*работаем/, /не\s*сотрудничаем/,
  /объявление/, /объявлении/, /нет\s*необходимости/, /не\s*ищу/, /не\s*надо/,
  /не\s*хочу/, /отказ/, /спасибо\s*,?\s*нет/, /не\s*нужно/, /уже\s*нашли/,
  /эй\s*чар/, /эйчар/, /hr/, /кадры/, /кадров(ый|ая|ых)/, /точно\s*нет/,
  /не\s*актуально/, /неактуально/, /в\s*вакансии/, /смысла\s*нет/, /против/,
  /справимся/, /сами/, /справлюсь/, /неверная/, /информация/, /закрыт/
];

const isPositiveResponse = (text) => {
  if (!text || text === 'N/A') {
    log(`Ответ не положительный: текст пустой или N/A (text=${text})`);
    return false;
  }

  const normalizedText = text.trim().replace(/\s+/g, ' ').normalize('NFC').toLowerCase();
  const hasNegative = negativePatterns.some(pattern => {
    const match = pattern.test(normalizedText);
    if (match) log(`Найден отрицательный шаблон: ${pattern}`);
    return match;
  });

  if (hasNegative) {
    log(`Ответ не положительный: найден отрицательный шаблон (text=${text})`);
    return false;
  }

  log(`Ответ положительный (text=${text})`);
  return true;
};

module.exports = { isPositiveResponse };