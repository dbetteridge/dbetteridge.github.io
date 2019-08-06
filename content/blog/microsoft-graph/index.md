---
templateKey: blog-post
title: Let's talk to Active Directory
date: 2019-07-21T15:04:10.000Z
featuredpost: false
featuredimage: ./explain.jpg
description: When you need to find out info about your users and groups, using the approved tools of your benign IT overlords
tags:
  - node
  - active directory
---

![Explaining AD](./explain.jpg)

## The project at hand

We have a system that manages users and groups of users, they are given access to certain modules of information and this needs to be controlled by the team in charge of a certain project.

We also use Active Directory for internal group and user management therefore!

we need to be able to do a list of operations that talk to active directory.

- List groups found active directory
- List users from a given group
- Quickly check if a user is a group member

## The How

For this process we're going to talk to the Microsoft graph, for the purposes of this post everything is already setup so that groups and users can be found within it.

1. Obtain a bearer token

   ```javascript
   const rootLogin = `https://login.microsoftonline.com/companynamegoeshere.onmicrosoft.com/oauth2/v2.0/token`

   const params = {
     grant_type: "client_credentials",
     client_id: process.env["waad_client_id"] || "",
     client_secret: process.env["waad_client_secret"] || "",
     scope: "https://graph.microsoft.com/.default",
   }

   const encodedUrlParams = Object.keys(params)
     .map(key => key + "=" + params[key])
     .join("&")

   const content_type = "application/x-www-form-urlencoded"
   const getAccessToken = async () => {
     return fetch(rootLogin, {
       headers: { "Content-Type": content_type },
       method: "POST",
       body: encodedUrlParams,
     })
       .then(body => body.json())
       .then(json =>
         json
           ? `${json.token_type} ${json.access_token}`
           : new Error("Failed to retrieve token")
       )
       .catch(console.log)
   }
   ```

   We need to talk to the oauth endpoint and hand over our `client_id` and `client_secret`, in return we get a time limited Bearer token to request data.

2. Get a list of groups

   ```javascript
   export const getADGroups = async name => {
     if (!access_token) {
       access_token = await getAccessToken()
     }
     const groupResults = await fetch(
       `https://graph.microsoft.com/v1.0/groups?$top=10&$filter=startsWith(displayName, '${name}')&$select=id,displayName&$format=json`,
       {
         method: "GET",
         headers: { Authorization: access_token },
       }
     )
       .then(body => body.json())
       .catch(console.log)
     const groups = groupResults && groupResults.value
     return groups
   }
   ```

   For our use case we are searching by the start of the group name, and restricting our search to the top 10 results.

3. Pagination!

   ```javascript
   const getAllPages = async (pages, pageResults) => {
     if (!access_token) {
       access_token = await getAccessToken()
     }
     // Store results into pages
     // If nextLink call getADpages with new link
     // Repeat till nextLink doesnt exist then return
     pages = pages.concat(pageResults.value)
     if (pageResults && typeof pageResults["@odata.nextLink"] === "string") {
       const page_results = await fetch(pageResults["@odata.nextLink"], {
         method: "GET",
         headers: { Authorization: access_token },
       }).then(body => body.json())

       pages = getAllPages(pages, page_results)
     }
     return pages
   }

   const getNPages = async (pages, pageResults, n) => {
     if (!access_token) {
       access_token = await getAccessToken()
     }
     // Store results into pages
     // If nextLink call getADpages with new link
     // Repeat till nextLink doesnt exist then return
     pages = pages.concat(pageResults.value)
     if (n > 0) {
       if (pageResults && typeof pageResults["@odata.nextLink"] === "string") {
         const page_results = await fetch(pageResults["@odata.nextLink"], {
           method: "GET",
           headers: { Authorization: access_token },
         })
           .then(body => body.json())
           .catch(err => console.log(err))
         pages = getNPages(pages, page_results, n - 1)
       }
     }
     return pages
   }
   ```

   We need some helper functions to paginate through the returned results when the number of members > 100
   the graph api will return a property `@odata.nextLink` which contains a url to retrieve the next batch.

   We have two helper functions, the first will keep going till the property is no longer present (very slow, many http requests)
   The second takes a `n` parameter describing the level of recursion it should go to, this avoids it getting stuck in an infinite recursion loop (hopefully) and speeds things up.

4. Get group members

   ```javascript
   export const getADGroupMembers = async groupId => {
     if (!access_token) {
       access_token = await getAccessToken()
     }
     const groupResults = await fetch(
       `https://graph.microsoft.com/v1.0/groups/${groupId}/transitiveMembers?$filter@odata.type eq '#microsoft.graph.user'`,
       {
         method: "GET",
         headers: { Authorization: access_token },
       }
     )
       .then(body => body.json())
       .catch(console.log)
     let members = []
     members = await getAllPages(members, groupResults)
     return members
   }
   ```

   Grabs all the group members using the first pagination helper function.

   ```javascript
   export const getNPagesADGroupMembers = async (groupId, numPages) => {
     if (!access_token) {
       access_token = await getAccessToken()
     }
     const groupResults = await fetch(
       `https://graph.microsoft.com/v1.0/groups/${groupId}/transitiveMembers`,
       {
         method: "GET",
         headers: { Authorization: access_token },
       }
     )
       .then(body => body.json())
       .catch(console.log)
     let members = []
     members = await getNPages(members, groupResults, numPages - 1)
     members = members.filter(
       member => member["@odata.type"] === "#microsoft.graph.user"
     )
     return members
   }
   ```

   Grab the first n pages of the group members using the second pagination helper function.

5. Check group membership for a single user and a list of groups

   ```javascript
   export const checkADGroupMembership = async (ad_groups, email) => {
     if (!access_token) {
       access_token = await getAccessToken()
     }

     const groupResults = await fetch(
       `https://graph.microsoft.com/v1.0/users/${email}/checkMemberGroups`,
       {
         method: "POST",
         headers: {
           Authorization: access_token,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ groupIds: ad_groups }),
       }
     )
       .then(body => body.json())
       .catch(console.log)
     return groupResults && groupResults.value
   }
   ```

   Here we pass a list of group id's and a single email address, this uses a built in function
   in Microsoft graph and returns the `group_id's` the email is a member of.

## Make it fast

The microsoft graph API is...slow (understandably), for anything more then a single call we will be waiting
multiple seconds, for the cases of pagination where we might be fetching 5+ pages of users from a group
where each call takes 1+ seconds this quickly adds up.

So what we're going to do is stick redis in front of our calls to the graph with a 3600 second expiry time.
This way our most popular calls are not hitting the graph each time, we only pay the penalty once.

```json

  Pre redis
  ✓ Searching specific group (3038ms)
  ✓ Searching specific group - case insensitive (625ms)
  ✓ Fetching group and its members (2106ms)
  ✓ Check AD group membership (942ms)
  ✓ Get N pages of users (3777ms)

  Post redis
  ✓ Searching specific group (19ms)
  ✓ Searching specific group - case insensitive (11ms)
  ✓ Fetching group and its members (6ms)
  ✓ Check AD group membership (1ms)
  ✓ Get N pages of users (3ms)
```

## TADA

We've accomplished the tasks we set out to do, a good way to talk to Active Directory without
needing to be on premise.

This allows project managers to setup a single group in active directory and reuse it elsewhere
no further setup needed.

The approach with redis of limiting caches to an hour is a tradeoff to ensure that access can be revoked from AD within a 'reasonable' timeframe.
