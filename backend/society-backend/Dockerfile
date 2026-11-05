# Stage 1: build the application and run the automated tests
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B package

# Stage 2: a small image that only runs the finished application
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 1001 appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]