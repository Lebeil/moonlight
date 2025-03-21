/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != \"\" ",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != \"\" ",
    "viewRule": "@request.auth.id != \"\" "
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"organisateur\"",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.role = \"organisateur\" || @request.auth.id = organizer.id)",
    "listRule": "@request.auth.id != \"\" && @request.auth.role = \"organisateur\"",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.role = \"organisateur\" || @request.auth.id = organizer.id)",
    "viewRule": "@request.auth.id != \"\" && @request.auth.role = \"organisateur\""
  }, collection)

  return app.save(collection)
})
