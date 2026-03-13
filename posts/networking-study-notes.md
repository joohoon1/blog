---
title: Networking Study Notes
date: '2026-03-13T16:44:11.139Z'
tags: study
---
Layer 4 (Transport Layer) protocol manages data packet delivery and handles flow control, segmentation and error recovery. It includes protocols like TCP and UDP.

TCP is reliable due to its three-way handshake connection that ensures both the client and server acknowledge connection before transmission of data. This handshake adds overhead and results in higher latency compared to UDP.

UDP is less reliable but faster than TCP. It does not establish a connection and instead sends out data immediately. This can result in lost packets but also means lower latency compared to TCP.

Layer 7 (Application Layer) protocol application level data delivery. Includes protocols like HTTP, WebSockets, WebRTC and DNS.

HTTP builds ontop of TCP and is the standard when it comes to building data communication on the internet. It is a stateless protocol, meaning that each request is independent and the server doesn't need to maintain information about previous requests.
