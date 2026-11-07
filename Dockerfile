# Stage 1: build the Angular screens
FROM node:24-alpine AS web
WORKDIR /web
COPY frontend/society-frontend/package*.json ./
RUN npm ci
COPY frontend/society-frontend/ ./
RUN npm run build

# Stage 2: build the backend (runs the tests) with the screens inside it
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /app
COPY backend/society-backend/pom.xml .
COPY backend/society-backend/src ./src
COPY --from=web /web/dist/society-frontend/browser ./src/main/resources/static
RUN mvn -B package

# Stage 3: a small image that only runs the finished application
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 1001 appuser
COPY --from=api /app/target/*.jar app.jar
USER appuser
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55 -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]