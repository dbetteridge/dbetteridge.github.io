---
templateKey: blog-post
title: A Lost CORS?
date: 2020-08-18T15:04:10.000Z
featuredpost: false
featuredImage: ./stop-lizard.jpg
cover: ./stop-lizard.jpg
description: CORS, PWA's and frustration
tags:
  - javascript
  - pwa
  - cors
  - security
  - suffering
---

I recently decided that I wanted to practice using a few of the browsers API's to try and build something on 3rd party API's rather then always building my own right off the bat.

I'll build a podcast app! that's something you can do easily in the browser I thought.

IndexedDB to store the metadata and cache the audio files and images, Service-Workers to pre-load content and make things work nicely offline.

## Roadblock

Pretty much as soon as I had setup the basic app skeleton I wanted to try and load my first RSS feed, get some podcast links and play some audio.

![STOP](stop-sign.png)

This is the point I learnt that a lot of podcasts are not served with CORS headers, even Google's feedproxy.google.com does not return CORS headers!

For anyone who has ever tried to setup their first API, CORS is one of those annoyances you run into almost immediately when trying to do so

> Me: I just want to get some JSON!

> Browser: this has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

When you run your own server this is an easily solvable problem, when you get sent an HTTP request simply include

`Access-Control-Allow-Origin: *` and

`Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept`

headers in your response, the values of these vary by your setup but these are fine as basic setup.

Unfortunately you cannot force 3rd party server owners to enable these, so you need either setup a proxy (Can get expensive) or only support content that does return those headers (Very limited range!)

## Options

If you have a link to the audio file, you can just put this straight into an `<audio>` element and it will be playable.

<b>But</b> you cannot access that data from javascript, so no caching it into IndexedDB or doing any sort of browser side audio improvements.

You can request the resource with `mode: 'no-cors'` which a Service-Worker is still able to cache the resulting data, but you cannot access this data outside of just serving it up to the `<audio>` element as discussed above, this allows offline to work and is an improvement but still not at the level of a 'Native' application.

## Whats next?

Well for now my project is on the back-burner, I've begun the process of implementing my own API to handle indexing RSS feeds, Retrieving and caching media from the various podcast sources,
but the initial piece of work I wanted to do to learn about browser API's is unfortunately hobbled by CORS and mixed-content issues.

I'm told the best way to find out the answer to a question is post the wrong one online, So I hope that if there is a way around these issues someone reads this and can tell me.

## Solutions

Could we have some kind of CORS/Mixed Content proxy that is only accessible to installed PWA's ?

I'll leave it up to someone with more experience in the browser security model to tell me why that won't work the way I think.

## Further Reading

[Paul's great prior article - 2015](https://aerotwist.com/blog/cors-for-concern/)
