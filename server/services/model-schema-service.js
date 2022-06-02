'use strict';

const qs = require('qs');

module.exports = ({ strapi }) => ({
  getModelSchema(queryParams) {
    const { query, model, deep } = qs.parse(queryParams);
    if (deep) {
      return deepModelSchema(strapi, model, query)
    }

    const schema = shallowModelSchema(strapi, model);
    if (!schema) {
      return undefined;
    }
    const {__schema__, ...rest} = schema;
    return rest;
  },
});

function shallowModelSchema(strapi, model) {
  // fast path: model name is singular
  if (strapi.api[model] && strapi.api[model].contentTypes[model]) {
    return strapi.api[model].contentTypes[model];
  }

  // slow path: loop through all models, look by both singular and plural
  for (const apiSurface of Object.values(strapi.api)) {
    for (const contentType of Object.values(apiSurface.contentTypes)) {
      if (contentType.info.singularName === model || contentType.info.pluralName === model || contentType.uid === model) {
        return contentType;
      }
    }
  }

  for (const component of Object.values(strapi.components)) {
    if (component.uid === model) {
      return component
    }
  }
  return undefined;
}

function deepModelSchema(strapi, model, query) {
  const uidToEntity = new Map();
  for (const apiSurface of Object.values(strapi.api)) {
    for (const contentType of Object.values(apiSurface.contentTypes)) {
      uidToEntity.set(contentType.uid, contentType);
    }
  }
  for (const component of Object.values(strapi.components)) {
    uidToEntity.set(component.uid, component);
  }

  const isPrimitiveType = (type) => !["component", "dynamiczone", "relation", "media"].includes(type);

  const buildSchema = (model, populate) => {
    const attributes = Object.entries(model.attributes)
      .filter(([_, attr]) => !attr.private)

    const primitiveFieldsSchema = Object.fromEntries(
      attributes
        .filter(([_, attr]) => isPrimitiveType(attr.type))
        .map(([key, attribute]) => [
          key, attribute.type
        ])
    )

    if (!populate) {
      return primitiveFieldsSchema;
    }

    const fieldsToPopulate = Array.isArray(populate)
      ? populate
      : typeof populate === "object"
        ? Object.keys(populate)
        : typeof populate === "string" && populate !== "*"
          ? [populate]
          : "*";
    
    const nonPrimitiveChildren = attributes
      .filter(([_, attr]) => !isPrimitiveType(attr.type))
      .filter(([_, attr]) => attr.configurable === true || attr.configurable === undefined)
      .filter(([key, attr]) =>
        (typeof fieldsToPopulate !== "string" && fieldsToPopulate.includes(key)) ||
        populate === "*"
      );

    const isRepeatableRelation = (relation) =>
      relation === "oneToMany" || relation === "manyToMany";

    const maybeWrapInRepeatableSchema = (schema, shouldWrap) => 
      shouldWrap ? [schema] : schema;

    const nonPrimitiveFieldsSchema = Object.fromEntries(
      nonPrimitiveChildren.map(([key, attr]) => {
        if (attr.type === "relation") {
          return [key, {
            data: maybeWrapInRepeatableSchema(
              {
                id: "ID",
                attributes: {
                  ...buildSchema(
                    uidToEntity.get(attr.target),
                    populate?.[key]?.populate
                  )
                },
                __uid: attr.target
              }, isRepeatableRelation(attr.relation)
            )
          }]
        } else if (attr.type === "component") {
          return [key, maybeWrapInRepeatableSchema(
            {
              id: "ID",
              ...buildSchema(uidToEntity.get(attr.component), populate?.[key]?.populate)
            }, attr.repeatable)
          ];
        } else if (attr.type === "dynamiczone") {
          return [key, 
            attr.components.map(component => ({
              id: "ID",
              __component: component,
              ...buildSchema(uidToEntity.get(component), populate?.[key]?.populate)
            }))
          ]
        } else if (attr.type === "media") {
          return [key, "media"]
        }

        return [key, null];
      })
    );
    return {
      ...primitiveFieldsSchema,
      ...nonPrimitiveFieldsSchema
    }
  }

  const rootContentType = shallowModelSchema(strapi, model);
  return {
    id: "ID",
    attributes: buildSchema(rootContentType, query?.populate)
  }
}