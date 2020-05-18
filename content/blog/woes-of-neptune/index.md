---
templateKey: blog-post
title: Woes of Neptune
date: 2020-05-18T15:04:10.000Z
featuredpost: false
description: Graph databases, IT and the web
tags:
  - node
  - neptune
  - graph
  - gremlin
  - gremlin-javascript
---

This story begins on a day like any other, I hear the faint whisperings of 'Graph database' and 'Cloud', Next thing I'm tasked with setting up a Neptune database in AWS, migrating a set of existing data from a relational structure.

### So it begins

Not having worked with neptune before I naturally headed for the AWS documentation on the subject [Hmm...](https://docs.aws.amazon.com/neptune/latest/userguide/access-graph-gremlin-node-js.html)

### Some fun restrictions

- Must reside inside a VPC
- No username/password authentication
- Must use IAM roles for user authentication

That third one will cause some trouble later.

### So I create a neptune instance

- Cluster to contain the instances
- Instance of t3.medium size (Dev/Testing)
- Attach to VPC
- Assign security group (LAN restriction in our case)
- Assign private subnets
- Enable IAM authentication (To control who can write/delete more so then read data)

### Connection

For our setup I am connecting from a NodeJS server so I went with the suggestion of [Gremlin Javascript](https://github.com/apache/tinkerpop/tree/master/gremlin-javascript/src/main/javascript/gremlin-javascript)

#### Issues

##### IAM auth breaks everything

Turning on IAM auth for the Neptune database simply returns a 'Connection Refused'  
The following steps have been attempted to fix this and a call is in with AWS Support

- Sign the request  
  Using [AWS4](https://github.com/mhart/aws4) I can generate a token from a set of AWS credentials and pass it as the Authorization header.
  Attempting a connection using the https endpoint provided simply responds with 'Connection Refused', the user signing the request has full Admin access
- Use a lambda  
  A lambda within the VPC was setup, security groups and the IAM role applied, the result being the same as the above
- Disable IAM auth  
  Immediately restores access, even without signed requests. Both on the lambda and on a machine within the VPC

##### Gremlin-javascript swallows errors

The gremlin connection is websocket based and for some reason I haven't dug into yet it does not convert websocket connection errors into resolved promises.
Any connection issue that happens with gremlin means that the promise it returns will never resolve or reject
Partial hack solution is as follows

```javascript
const gremlin = require("gremlin")
const WebSocket = require("ws")

const { DriverRemoteConnection } = gremlin.driver
const { Graph } = gremlin.structure

const dc = new DriverRemoteConnection(`wss://${host}/gremlin`)

const graph = new Graph()

try {
  const ws = new WebSocket(`wss://${host}/gremlin`)
  ws.on("open", function open() {
    ws.send("TEST")
    ws.terminate()
  })
  const g = graph.traversal().withRemote(dc)
} catch (e) {
  //Handle here
}
```

This will throw properly if the first websocket connection fails and not attempt the connection with gremlin-javascript

## What next?

Hopefully some of this can help others who run into similar issues and now I wait in silent hope for AWS Support to track down our connection refusal issues.
