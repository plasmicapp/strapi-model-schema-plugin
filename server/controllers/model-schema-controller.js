'use strict';

module.exports = {
  index(ctx) {
    const schema = strapi
      .plugin('model-schema')
      .service('modelSchemaService')
      .getModelSchema(ctx.query);
    ctx.body = JSON.stringify(schema);
    ctx.set("Content-Type", "application/json");
  },
};
