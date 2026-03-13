---
title: Networking Study Notes
date: '2026-03-13T16:44:11.139Z'
tags: study
updated: '2026-03-13T17:25:21.785Z'
---
For most web development, we're really only concerned with layer 3, 4 and 7 of the [OSI model](https://en.wikipedia.org/wiki/OSI_model).

## layer 3 (network layer)
The only thing worth knowing here is that nodes (servers) are assigned IP addresses on a network. Nodes have unique IPs on a local network and public IPs are assigned by an [ISP](https://en.wikipedia.org/wiki/Internet_service_provider).

## layer 4 (transport layer)

This layer manages data packet delivery and handles flow control, segmentation and error recovery. It includes protocols like TCP and UDP.

TCP is reliable due to its three-way handshake that ensures both parties acknowledge the connection before data is transmitted. This handshake adds overhead and results in higher latency compared to UDP.

UDP is less reliable but faster than TCP. It does not establish a connection and instead sends out data immediately. This can result in lost packets but also means lower latency compared to TCP.

## layer 7 (application layer)

This layer handles application-level data delivery, including protocols like HTTP and DNS.

HTTP builds on top of TCP and is the standard when it comes to building data communication on the internet. It is a stateless protocol, meaning that each request is independent and the server doesn't need to maintain information about previous requests.

HTTP request methods represent an intended action on resources:
- GET: Request resource from server
- POST: Create new resource on server
- PUT: Update resource on server
- PATCH: Update resource partially
- DELETE: Delete resource from server

HTTP return status codes that indicate the general outcome of the request:
- 2XX: Success
- 3XX: Redirection
- 4XX: Client Error
- 5XX: Server Error
