'use strict';

module.exports = ({ strapi }) => ({
  getModelSchema(model) {
    const schema = strapi.api[model].contentTypes[model];
    const {__schema__, ...rest} = schema;
    return rest;
  },
});
