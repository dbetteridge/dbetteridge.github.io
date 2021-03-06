---
templateKey: blog-post
title: Don't feed them after midnight
date: 2020-08-02T15:04:10.000Z
featuredpost: false
description: Gremlin setup and structure
tags:
  - node
  - Neptune
  - graph
  - gremlin
  - gremlin-javascript
---

Below I describe some techniques I have found for querying nested data that does not fit well in a traditional relational database.
These are specific to the Gremlin query language and compatible databases.

### Setup for connecting to Neptune (VPC restriction but no IAM)

```javascript
const gremlin = require("gremlin")
const { Graph } = gremlin.structure
const { DriverRemoteConnection } = gremlin.driver
const graph = new Graph()

const remoteConnection = new DriverRemoteConnection(
  `wss://neptune-url:8182/gremlin`,
  {}
)
const connection = graph.traversal().withRemote(remoteConnection)
```

<br/>
All of the following use the connection object described above.<br/>
I'll use the Greek mythos as example queries.

### Access to gremlin functions in javascript

```javascript
const { id } = gremlin.process.t
const { in_, out, inE, properties } = gremlin.process.statics
const { within } = gremlin.process.P
```

- process.t provides native attributes like id and label
- process.statics provides querying functions such as in and out for following edges or retrieving properties
- process.P provides comparators like between, eq, within or gt

### Conditional Function composition

```javascript
const countChildren = baseQuery => {
  /**
   *  [titan | Kronos] -> child -> [god | Zeus]
   *  [titan | Hyperion] -> child -> [titan | Helios]
   *  [titan | Crius]
   * BECOMES
   *  [titan | Kronos] -> child -> [god | Zeus]
   *  [titan | Hyperion] -> child -> [titan | Helios]
   */
  return baseQuery.where(
    outE("child")
      .count()
      .is(gt(0))
  )
}
```

```javascript
const fetchChildren = baseQuery => {
  return baseQuery
    .project("name", "children")
    .by("name")
    .by(
      outE("child")
        .inV()
        .valueMap()
        .fold()
    )
}
```

```javascript
let baseQuery = connection.V().hasLabel("titan")

if (has_children) {
  baseQuery = countChildren(baseQuery)
}

if (get_children) {
  baseQuery = fetchChildren(baseQuery)
}

const result = await baseQuery.toList()
```

This example returns all Titans who have children, as well as a list of their children.

Subset of this below

```javascript
[
  Map {
    'name' => 'Hyperion',
    'children' => [ Map { 'name' => [ 'Helios' ] } ]
  },
  Map {
    'name' => 'Kronos',
    'children' => [ Map { 'name' => [ 'Zeus' ] } ]
  }
]
```

### End

Hopefully this will help someone else working with gremlin and AWS Neptune
