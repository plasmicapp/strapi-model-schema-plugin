'use strict';

module.exports = ({ strapi }) => ({
  getModelSchema(model) {
    const schema = findModelSchema(strapi, model);
    if (!schema) {
      return undefined;
    }
    const {__schema__, ...rest} = schema;
    return rest;
  },
});

function findModelSchema(strapi, model) {
  // fast path: model name is singular
  if (strapi.api[model] && strapi.api[model].contentTypes[model]) {
    return strapi.api[model].contentTypes[model];
  }

  // slow path: loop through all models, look by both singular and plural
  for (const apiSurface of Object.values(strapi.api)) {
    for (const contentType of Object.values(apiSurface.contentTypes)) {
      if (contentType.info.singularName === model || contentType.info.pluralName === model) {
        return contentType;
      }
    }
  }
  return undefined;
}