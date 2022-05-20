# Strapi plugin model-schema

Simple Strapi plugin that reflects out schema.json for different models.  Works for Strapi v4.

Creates a new url for querying the model schema:

```
/api/model-schema?model=product
```

The `model` query parameter should have the singular name of the model.

You must include at least a read token to gain access to the endpoint, specified as an authorization header:

```
Authorization: Bearer TOKEN
```
