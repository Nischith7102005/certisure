📜 CertiSure
Secure Digital Certificate Verification System










🔐 Overview

CertiSure is a secure, scalable, and intelligent digital certificate verification platform designed to eliminate academic certificate forgery and manual verification inefficiencies.

The platform enables institutions to issue tamper-proof digital certificates and allows employers or authorities to verify them instantly using cryptography, QR codes, OCR, and AI-assisted analysis.

CertiSure ensures authenticity, transparency, and traceability through modern full-stack architecture and DevOps-enabled deployment.

🚨 Problem Statement

Traditional certificate verification systems suffer from:

❌ Manual and time-consuming verification processes

❌ Easy forgery of PDFs and scanned certificates

❌ Absence of a centralized verification authority

❌ Poor scalability across institutions

❌ No proper audit trails or traceability

These limitations result in delays, fraud, and lack of trust in credential verification.

💡 Solution

CertiSure provides an automated, secure, and centralized digital verification ecosystem that:

Verifies certificate authenticity instantly

Prevents document tampering and forgery

Maintains immutable verification records

Scales efficiently for institutions and authorities

🎯 Objectives

✅ Prevent academic certificate forgery

✅ Eliminate manual verification workflows

✅ Enable real-time certificate validation

✅ Ensure data integrity and authenticity

✅ Maintain transparent audit logs

✅ Support institutional scalability

🧠 Key Features
🔎 Certificate Verification

Secure QR code generation and validation

Hash-based certificate authenticity checks

Metadata verification against stored records

🤖 AI-Based Verification Engine

OCR text extraction using Tesseract.js

QR decoding and validation

Visual layout & tampering analysis

Trust score generation (0–100)

👥 Role-Based Access Control

Issuers – Educational Institutions

Verifiers – Employers / Authorities

Secure authentication using JWT & bcrypt

📊 Audit & Logging

Tracks login attempts

Logs certificate uploads

Records verification activities

Ensures accountability and compliance

☁️ Scalable & Secure Architecture

NoSQL database for flexibility and performance

Dockerized microservice-ready deployment

CI/CD automation using Jenkins & GitHub Actions

🏗️ System Architecture
Users (Issuers / Verifiers)
        |
     Frontend
 (HTML, CSS, JS)
        |
   Backend APIs
 (Node.js, Express)
        |
 AI Verification Engine
 (QR + OCR + Analysis)
        |
     MongoDB
 (Certificates, Users, Logs)
        |
   DevOps & CI/CD
 (Docker, Jenkins, AWS EC2)

🧰 Technology Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript, Bootstrap
Backend	Node.js, Express.js
Database	MongoDB (NoSQL)
Authentication	JWT, bcrypt
AI & OCR	Tesseract.js, QR Decoders
DevOps	Docker, Jenkins, GitHub Actions
Cloud	AWS EC2, AWS S3
Version Control	Git, GitHub
🗃️ Database Design (MongoDB)
Collections Used

Users

Email

Hashed Password

Role

Certificates

Certificate ID

Student & Institution Details

Hash & QR Metadata

Verification Status

Verification Logs

Request Details

Verification Result

Confidence Score

Audit Logs

System Events

Security Tracking

Templates

Certificate Layout Metadata

🔐 Security Measures

Password hashing using bcrypt

JWT-based authentication

Role-based access control

Secure API endpoints

Encrypted communication

Detailed audit logging

🚀 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/Nischith7102005/certisure.git
cd certisure

2️⃣ Install Dependencies
npm install

3️⃣ Start MongoDB

Ensure MongoDB is running locally or configure MongoDB Atlas.

mongod

4️⃣ Run the Server
node server.js


Server URL:

http://localhost:3001

🐳 Docker Deployment
Build Docker Image
docker build -t certisure .

Run Docker Container
docker run -d -p 3001:3001 --name certisure certisure

🔁 CI/CD Pipeline

CertiSure uses Jenkins + GitHub Actions for automation.

Pipeline Stages

Code Commit (GitHub)

Build & Dependency Installation

Automated Testing

Docker Image Build

Deployment to AWS EC2

Monitoring & Logs

📌 Applications

🎓 Universities & Colleges

🧑‍💼 Recruitment Agencies

🏛️ Government Verification Bodies

🌐 Online Education Platforms

📜 Certification Authorities

⚠️ Limitations

Requires stable internet connectivity

Initial infrastructure setup complexity

OCR accuracy may vary for low-quality scans

Requires secure cloud maintenance

🔮 Future Enhancements

🔗 Blockchain-based immutable verification

🧠 Deep-learning forgery detection

📱 Mobile app for instant scanning

🌍 Multilingual OCR support

📈 Advanced analytics dashboard

🏛️ Government & university database integration

🌱 Sustainable Development Goals (SDGs)

SDG 4: Quality Education

SDG 9: Industry, Innovation & Infrastructure

🔗 Project Links

GitHub Repository:
https://github.com/Nischith7102005/certisure

Live Deployment (Vercel):
https://certisure-nu.vercel.app

AWS EC2 Public IP:
13.48.201.53

👨‍💻 Team Members

Nischith R – ENG23CT0011

Sanketh Salunke – ENG23CT0059

G R Tilak – ENG23CT0029

Nithya Patel – ENG23CT0012

Abhavya – ENG23CT0023

Under the guidance of:
Dr. Santhosh Kumar J
Associate Professor, DSU

📜 License

This project is developed as part of Product Design & Development (23CT354X)
Dayananda Sagar University
Academic Year: 2025–2026
