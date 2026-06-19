# Dwellio API — production image (Java 21)
FROM eclipse-temurin:21-jdk-alpine AS build

RUN apk add --no-cache maven

WORKDIR /app

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwellio && adduser -S dwellio -G dwellio

WORKDIR /app

COPY --from=build /app/target/dwellio-api-*.jar app.jar

USER dwellio

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
