<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Objects (JSON) (OBJECT)

Build and read objects — e.g. a JSON response or an Excel row.

## CREATE_OBJECT

Create Object · French label in the builder: « Créer un objet »

`CREATE_OBJECT() → string`

Creates a new object from a JSON string parameter, or an empty object if none provided.

Inputs: none.

Parameters:
- `json` (string, optional) — Optional JSON string to initialize the object

## GET_PROPERTY

Get Property · French label in the builder: « Lire une propriété »

`GET_PROPERTY(object: object | string) → any`

Gets a property value by key from an object — a live object (e.g. a row of GET_EXCEL_ROWS), whose values keep their type (numbers, dates, …), or a JSON object string, whose values come back as strings. Dot notation reaches nested properties ("a.b.c"), unless the object has the key exactly as written (e.g. an Excel column "Réf. client").

Inputs, in this order:
1. `object` (object | string) — The object, or a JSON object string, to read from.

Parameters:
- `key` (string, required) — The property key (supports dot notation for nested access)

## SET_PROPERTY

Set Property · French label in the builder: « Définir une propriété »

`SET_PROPERTY(object: string) → string`

Sets a property on a JSON object string. Takes input as the JSON string. Supports nested keys with dot notation.

Inputs, in this order:
1. `object` (string) — The JSON object (as a JSON string) to operate on.

Parameters:
- `key` (string, required) — The property key (supports dot notation for nested access)
- `value` (string, required) — The value to set (will be parsed as JSON if possible)

## SET_PROPERTY_DYNAMIC

Set Property (dynamic) · French label in the builder: « Définir une propriété (dynamique) »

`SET_PROPERTY_DYNAMIC(object: string, value: any) → string`

Sets a property on a JSON object string using a dynamic value input. Takes 2 inputs: [jsonString, value].

Inputs, in this order:
1. `object` (string) — The JSON object (as a JSON string).
2. `value` (any) — The value to set on the property.

Parameters:
- `key` (string, required) — The property key (supports dot notation)

## DELETE_PROPERTY

Delete Property · French label in the builder: « Supprimer une propriété »

`DELETE_PROPERTY(object: string) → string`

Deletes a property from a JSON object string by key. Supports dot notation.

Inputs, in this order:
1. `object` (string) — The JSON object (as a JSON string) to operate on.

Parameters:
- `key` (string, required) — The property key to delete (supports dot notation)

## MERGE_OBJECTS

Merge Objects · French label in the builder: « Fusionner des objets »

`MERGE_OBJECTS(object1: string, object2: string) → string`

Merges two JSON object strings into one (shallow merge, second overrides first). Takes 2 inputs: [obj1, obj2].

Inputs, in this order:
1. `object1` (string) — The first JSON object (as a JSON string).
2. `object2` (string) — The second JSON object (as a JSON string); its keys override the first.

Parameters: none.

## HAS_PROPERTY

Has Property · French label in the builder: « Contient une propriété »

`HAS_PROPERTY(object: string) → boolean`

Checks if a property exists in a JSON object string. Returns true/false.

Inputs, in this order:
1. `object` (string) — The JSON object (as a JSON string) to operate on.

Parameters:
- `key` (string, required) — The property key to check (supports dot notation)

## GET_KEYS

Get Keys · French label in the builder: « Clés de l'objet »

`GET_KEYS(object: string) → string`

Returns the keys of a JSON object as a JSON array string.

Inputs, in this order:
1. `object` (string) — The JSON object (as a JSON string) to operate on.

Parameters: none.
