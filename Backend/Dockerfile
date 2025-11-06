# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY Backend.csproj ./
RUN dotnet restore

# Copy all source code folders (exclude tests)
COPY Controllers/ ./Controllers/
COPY Models/ ./Models/
COPY Repositories/ ./Repositories/
COPY Services/ ./Services/
COPY Program.cs ./Program.cs
# Add any other folders needed by the main project

# Publish
RUN dotnet publish Backend.csproj -c Release -o /app

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 5000
ENTRYPOINT ["dotnet", "Backend.dll"]
