module.exports = {
  port: process.env.PORT || 80,
  bitrixUrl: 'https://kelin.bitrix24.ru/rest/334/7b2r5tgugcg0bpsg/crm.lead.add.json',
  dataPath: {
    excel: 'data/excel_data.json',
    webhooks: 'data/webhooks.json',
    log: 'data/server.log'
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024 // 5MB
  }
};