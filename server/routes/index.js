module.exports = {
  'content-api': {
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/',
        handler: 'modelSchemaController.index',
        config: {
          policies: [],
          auth: {
            scope: ["find"]
          },
        },
      },
    ]
  }
};
