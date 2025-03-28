/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // remove field
  collection.fields.removeById("text1579384326")

  // remove field
  collection.fields.removeById("date2862495610")

  // remove field
  collection.fields.removeById("file80579794")

  // remove field
  collection.fields.removeById("text917281265")

  // add fields
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "field5156154506",
    "maxSelect": null,
    "name": "organizer",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation",
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3526387695")

  // remove fields
  collection.fields.remove(["field5156154506"])

  // update collection data
  unmarshal({
    "listRule": "id = @request.auth.id",
    "viewRule": "id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
