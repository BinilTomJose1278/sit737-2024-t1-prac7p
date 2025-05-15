# SIT323/SIT737 – Practical 7P: Calculator Microservice with MongoDB in Kubernetes

##  Project Overview

This project demonstrates the deployment of a Node.js-based calculator microservice on a Kubernetes cluster. The microservice supports arithmetic operations and is integrated with a MongoDB database to persist calculation results using Mongoose. Logging is implemented using Winston, and the entire stack is containerized with Docker and deployed via Kubernetes manifests.

---

## 🛠️ Technologies Used

- **Node.js**, **Express.js**, **Mongoose**
- **Docker**, **Docker Hub**
- **Kubernetes**, **Minikube**
- **MongoDB**, **MongoDB Compass**, `mongo` CLI
- **Winston** for structured logging

---

##  Deployment Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/biniltomjose12780/sit323-737-2024-t1-prac7p.git
cd sit323-737-2024-t1-prac7p
```
### 2. Build and Push the Docker Image
```bash
docker build -t biniltomjose12780/calculator-microservice:latest .
docker push biniltomjose12780/calculator-microservice:latest
```
### 3.  Create Kubernetes Secret for MongoDB Credentials
```bash
kubectl create secret generic mongodb-secret \
  --from-literal=mongo-user=mongoadmin \
  --from-literal=mongo-password=admin123
```
### 4. Apply Kubernetes Manifests
```bash
kubectl apply -f kubernetes/k8s
```
This includes:

 - calculator-deployment.yaml

 - calculator-service.yaml

 - mongodb-deployment.yaml

 - mongodb-service.yaml

 - mongo-pv.yaml

 - mongo-pvc.yaml

### 5. Access the Application
```bash
kubectl port-forward svc/calculator-service 3000:80
```
Visit
```bash
http://localhost:3000/add?num1=5&num2=3
```
### 6. Verifying MongoDb Storage
Option A: Using a Temporary MongoDB Shell Pod
```bash
kubectl run mongo-client --rm -it --image=mongo -- bash
# Inside the pod shell:
mongo mongodb-service:27017 -u mongoadmin -p admin123 --authenticationDatabase admin
use test
db.calculations.find().pretty()
```
Option B : Using MongoDB Compass
### 1. Port-forward MongoDB service:
```bash
kubectl port-forward svc/mongodb-service 27017:27017
```
### 2 . In MongoDB Compass, use this connection string:
```bash
mongodb://mongoadmin:admin123@localhost:27017/?authSource=admin
```
### 3. Navigate to the test database → calculations collection

