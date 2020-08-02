const gremlin = require("gremlin")
const { id } = gremlin.process.t
const { outE } = gremlin.process.statics
const { gt } = gremlin.process.P
const { Graph } = gremlin.structure
const { DriverRemoteConnection } = gremlin.driver
const graph = new Graph()
const util = require("util")

const remoteConnection = new DriverRemoteConnection(
  `ws://localhost:8182/gremlin`,
  {}
)
const connection = graph.traversal().withRemote(remoteConnection)

const seed = async () => {
  await connection
    .V()
    .drop()
    .iterate()
  const kronos = await connection
    .addV("titan")
    .property("name", "Kronos")
    .next()

  const hyperion = await connection
    .addV("titan")
    .property("name", "Hyperion")
    .next()

  const helios = await connection.addV("titan").property("name", "Helios")

  const zeus = await connection.addV("god").property("name", "Zeus")

  await connection
    .V(kronos.value.id)
    .addE("child")
    .to(zeus)
    .next()

  await connection
    .V(hyperion.value.id)
    .addE("child")
    .to(helios)
    .next()

  zeus.next()
  helios.next()
}

const doThings = async () => {
  await seed()
  const has_children = true
  const get_children = true

  const countChildren = baseQuery => {
    return baseQuery.where(
      outE("child")
        .count()
        .is(gt(0))
    )
  }

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

  let baseQuery = connection.V().hasLabel("titan")

  if (has_children) {
    baseQuery = countChildren(baseQuery)
  }

  if (get_children) {
    baseQuery = fetchChildren(baseQuery)
  }
  // console.log((await baseQuery.next()).value)

  const result = await baseQuery.toList()
  if (result) {
    console.log(util.inspect(result, { showHidden: false, depth: null }))
    return result
  }
}

doThings().then(console.log)
