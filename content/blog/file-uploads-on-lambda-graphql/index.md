---
templateKey: blog-post
title: Uploading files to graphql on a AWS lambda
date: 2020-02-19T11:44:10.000Z
featuredpost: true
description: When you don't want to use the full Apollo Server but still want to upload files to your graphql server on a lambda
tags:
  - javascript
  - lambda
  - graphql
  - files
  - uploads
  - upload
  - aws
  - lambda
  - apollo
---

## Uploading files to graphql on lambda

### Part 1 - Check your content-type

If the content-type is application/json we proceed on the normal path and extract query and variables by parsing the lambda event body

```javascript
const body = JSON.parse(event.body)
query = body.query
variables = body.variables
operationName = body.operationName
```

### Part 2 - Not a json object

For non application/json types (You could narrow this to multi-part form data specifically) we process it using the graphql-upload package
specifically we use the processRequest function which parses the request object to convert the multipart data into an Upload type within graphql

```javascript
import { processRequest } from "graphql-upload"
import { Writable, Readable } from "stream"

if (event.headers["content-type"] !== "application/json") {
  const res = new Writable()
  const req = new Readable()
  req.headers = event.headers
  req.push(event.body)
  req.push(null)
  const processed = await processRequest(req, res)
  query = processed.query
  variables = processed.variables
}
```

processRequest takes a readableStream (request) and writeableStream (response) as input
As the lambda event is just a JSON object we create empty versions of these
For the request object we simply assign the headers from the event and push the event body into the readable stream as the data

### Part 3 - Other issues

I also experienced issues with processRequests use of

```javascript
isObject(object)
```

I received a message that isObject was not a function, which i traced down to an issue with our webpack bundling.
As the package isobject uses an ES6 style export and we do not parse the node_modules folder with webpack attempting to import
isObject from it as a default export was simply undefined.

```javascript
resolve: {
    alias: {
      isobject: path.resolve(__dirname, 'lib', 'isobject.js'),
    },
  }
```

I added the above to the webpack file , and created a copy of the isobject.js which was as below just using a standard ES5 export

```javascript
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
module.exports = function isObject(val) {
  return val != null && typeof val === "object" && Array.isArray(val) === false
}
```

### Conclusion - Success!

Uploading to the graphql endpoint now works perfectly, no changes to the lambda config itself were required.
content_handling is setup as "CONVERT_TO_TEXT"

[ProcessRequest - Apollo source](https://github.com/jaydenseric/graphql-upload/blob/master/lib/processRequest.js)
[Streams - Read, Write, Transform](https://www.sandersdenardi.com/readable-writable-transform-streams-node/)
[Multipart Graphql request](https://github.com/jaydenseric/graphql-multipart-request-spec)