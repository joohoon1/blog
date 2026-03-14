---
title: hello world
date: '2026-03-09T04:23:39.653Z'
tags: personal
updated: '2026-03-14T04:58:20.331Z'
---
I'm starting this blog as a way to track my learning and progress as a software engineer.

## experiences

Let's recap my experiences so far.

I studied at McMaster University and obtained a bachelor's degree in Mechatronics Engineering. I studied courses related to electrical, mechanical and software engineering. During my time at school I also did co-op (internship) at two different companies.

My first co-op was as a robotics developer with a company developing sustainable communities. I was tasked with developing a robot to be used within communities for package delivery. I was able to create a rover looking prototype that was able to autonomously move from point A to point B. I built the robot using electric motors, a custom built chassis, lidar sensors, gps, a few arduinos and a computer running on robot operating system (R.O.S.).

My second co-op was at an automotive company where I worked on developing software for automated trailer parking. I programmed heavily in C++ and worked on compiling and deploying to custom Xilinx hardware. I got to actually get into a Ford pick-up and test the software by having it back up the truck with a trailer attached, that was pretty cool.

My first full-time job was at General Motors, where I worked as a software simulations engineer. I worked on setting up the simulation environment used for testing automotive applications with hardware-in-the-loop (testing software on physical ECUs connected to computers) and software-in-the-loop (testing software purely on computers). I used Matlab and CANoe software and also programmed using Python and C++ for developing the test environments.

My second full-time job was at Amazon, where I worked as a software development engineer within Prime Video. I worked on some exciting projects during my time there.

My first project was building an in-house solution for a media channel assembly that would live-stream content 24/7 (think of a tv channel). I created a media management service that would handle the ingest and encoding of media files to be used by a media stitching service that would then output the content as a live-stream. In addition, I implemented dynamic ad insertion that would show advertising in-between content. The project launched 3 different live-stream channels on Prime Video.

My second project at Amazon was implementing a live-stream infrastructure scheduling service. The service would hibernate infrastructure for feeds that had no content playing and would start-up the infrastructure when scheduled content was close to starting. I worked on the implementation of the scheduling service and worked closely with upstream and downstream teams. The scheduling service saved roughly 15 million dollars in infrastructure cost for the first year.

There were many other impactful projects I had worked on. I optimized our infrastructure video encoding pipeline by making changes to our channel onboarding services to support new video encoding profiles, resulting in roughly 1.5 million dollars of savings on encoding costs per year. I optimized our channel onboarding services by reusing infrastructure for multiple feeds, eliminating redundant infrastructure costs. Lastly, I implemented the enablement of video down-conversion in our encoding pipeline in order to support the onboarding of one of Prime Video's new partners.

During my time at Amazon I programmed heavily in Java for all of the services and used Typescript for building the infrastructure as code. I built services using AWS components such as lambda, sqs, sns, dynamoDB, step-functions, ECS and many others. I noticed early on that Amazon likes to use AWS for everything.

## reflecting

After writing down my experiences so far, I guess I worked on a lot of cool stuff over the years.

I'm currently taking time off from work after feeling burnt out from a heavy on-call experience near the end of my time at Amazon. This was largely due to team re-organization and services transitions that resulted in my team having more operational load, resulting in frequent late night sev-2 pages.

From robotics, to automotive, to video live-streaming, I've certainly worked in interesting fields. My time at Amazon has made me realize that I do prefer working on scalable, distributed services compared to low-level programming. Perhaps it's the level of impact that I was able to see from the services I worked on. I think the system design work for high level systems and the cross-team collaboration required when interacting with external services was also an exciting part of the work.

I think wherever I go next, I hope I get to work on systems with a similar level of scale and impact. For now, my main focus is to learn more about system design and to experiment with different tools by creating my own projects. I'm planning on updating my progress here.
