/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != '' && (@request.auth.id = organizer.id)",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && (@request.auth.id = organizer.id)",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"organisateur\"",
    "deleteRule": "@request.auth.role = \"organisateur\"",
    "listRule": "id = @request.auth.id",
    "updateRule": "@request.auth.role = \"organisateur\"",
    "viewRule": "id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
