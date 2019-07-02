
# Annotator frontend

## Run dev locally

 - `npm install`
 - `npm start`

## Run dev in docker

 - `docker build -t annotator-frontend-dev -f Dockerfile.dev .`
 - `docker run -p 3000:3000 -t annotator-frontend-dev`

## Run production docker

 - `docker build -t annotator-frontend`
 - `docker run -p 8080:8080 -t annotator-frontend`
