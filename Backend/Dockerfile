# Backend/Dockerfile

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the project file and restore dependencies
COPY Backend.csproj ./
RUN dotnet restore

# Copy all source files for the project (exclude tests)
COPY . ./

# Publish only the Backend project, not the solution
RUN dotnet publish Backend.csproj -c Release -o /app

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 5000
ENTRYPOINT ["dotnet", "Backend.dll"]
