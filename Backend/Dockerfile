# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the main project file first
COPY Backend/Backend.csproj ./Backend/
WORKDIR /src/Backend
RUN dotnet restore

# Copy only the backend project files (ignore tests)
COPY Backend/. ./ 
RUN dotnet publish -c Release -o /app

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 5000
ENTRYPOINT ["dotnet", "Backend.dll"]
