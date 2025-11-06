# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the project file and restore dependencies
COPY Backend.csproj ./
RUN dotnet restore

# Copy only the app source files (exclude tests)
COPY Controllers/ ./Controllers/
COPY Models/ ./Models/
COPY Program.cs ./Program.cs
# ... copy any other folders/files required by your main project

# Publish only the Backend project
RUN dotnet publish Backend.csproj -c Release -o /app

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 5000
ENTRYPOINT ["dotnet", "Backend.dll"]
