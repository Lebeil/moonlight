/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3554030554")

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3526387695",
    "hidden": false,
    "id": "relation3852948764",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "partyId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1997877400",
    "max": 0,
    "min": 0,
    "name": "code",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool2705025656",
    "name": "scanned",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3554030554")

  // remove field
  collection.fields.removeById("relation3852948764")

  // remove field
  collection.fields.removeById("text1997877400")

  // remove field
  collection.fields.removeById("bool2705025656")

  return app.save(collection)
})
