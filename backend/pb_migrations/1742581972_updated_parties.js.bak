/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && @request.auth.role = \"organisateur\""
  }, collection)

  return app.save(collection)
})
