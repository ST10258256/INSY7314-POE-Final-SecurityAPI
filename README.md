# INSY7314-POE-Final-SecurityAPI

---

## Overview of the App

SecurityAPI is a web application built using:

* **Backend:** ASP.NET Core Web API (C#)
* **Frontend:** React + Vite
* **Database:** MongoDB
* **Hosting:** Render (Backend) + Local or Render (Frontend)

The system provides secure user authentication using JWT, API communication, and a React-based frontend UI.

## Developer Guide

[GUIDE.md](https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI/blob/main/GUIDE.md)

---

## Features

* JWT Authentication and Authorization
* Cross-Origin Resource Sharing (CORS) configured for HTTPS
* Environment-based configuration
* MongoDB integration
* React + Vite frontend
* Rate Limiting
* Content Security Policy (CSP)
* Idle session timeouts for session hijacking prevention
* SonarQube security analysis (SonarSource, 2025)

---

## How to Get Started

1. Clone or fork the repo:

```bash
git clone https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI.git
```

2. For local development, generate SSL certificates (Render handles this automatically):

```bash
choco install mkcert -y
mkcert -install
cd Frontend
mkcert localhost 127.0.0.1 ::1
```

3. Import your certificate:

   * Press **Windows + R → certmgr.msc**
   * Go to **Trusted Root Certification Authorities → Certificates**
   * **Right-click → All Tasks → Import**
   * Find `rootCA.pem` (usually in `Users/YourUser/AppData/mkcert`)
   * Complete the import wizard and restart your browser.

4. Run the frontend:

```bash
cd Frontend
npm run dev
```

5. Click the localhost link shown in your terminal — you can now register, log in, and interact with the app.

---

### Running Backend Locally

```bash
cd Backend
dotnet build
dotnet run
```

---

### Environment Variables

If you’re creating your own MongoDB instance:

```bash
MONGO_URI=<connection string>
MONGO_DATABASE_NAME=<database name>

JWT_KEY=<your key>
JWT_ISSUER=<issuer>
JWT_EXPIREMINUTES=<expiry time in minutes>
```

---

## Software Used

* npm
* Render
* Swagger
* MongoDB
* React + Vite
* Docker
* JWT
* CSP
* SonarQube

---

## Feedback Implemented

### 1. Serve All Traffic Over SSL

```csharp
options.ListenAnyIP(portToUse, listenOptions =>
{
    listenOptions.UseHttps(certificate);
});
```

**Explanation:**
Encrypts all API traffic over HTTPS. Render automatically enforces SSL in production.

---

### 2. Redirect HTTP → HTTPS

```csharp
app.UseHttpsRedirection();
```

**Explanation:**
Redirects all HTTP requests to HTTPS, blocking unencrypted communication.

---

### 3. Apply HSTS (Strict Transport Security)

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
```

**Explanation:**
Forces browsers to only connect via HTTPS to prevent downgrade attacks.

---

### 4. Secure Cookies, SameSite, and HttpOnly Flags

**Not applicable:**
This API uses JWT tokens in headers, not cookies.

---

### 5. Stricter CORS Policy

```csharp
builder.Services.AddCors(options => 
{
    options.AddPolicy("AllowReactLocal", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", // trusted local React dev server
            "https://localhost:5173",
            "http://localhost:5174",
            "https://localhost:5174",
            "https://securityapi-x4rg.onrender.com",
            "https://securityapi-site.onrender.com"
        )
        .WithHeaders("Content-Type", "Authorization") // Only allow these headers
        .WithMethods("GET", "POST", "PATCH") // Only allow GET, POST, and PATCH requests
        .AllowCredentials();
    });
});
```

**Explanation:**
Limits access to approved domains, headers, and methods to minimize attack exposure.

---

### 6. HTTP Parameter Pollution (HPP) Protection

```csharp
public class HppMiddleware
{
    private readonly RequestDelegate _next;

    public HppMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Get query parameters and keep only the first value for duplicates
        var query = context.Request.Query
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.FirstOrDefault());

        // Rebuild the query string using the cleaned parameters
        context.Request.QueryString = new QueryString("?" + string.Join("&", 
            query.Select(kvp => $"{kvp.Key}={kvp.Value}")
        ));

        // Continue to the next middleware
        await _next(context);
    }
}
```

**Explanation:**
Cleans duplicate query parameters before they hit the pipeline, neutralizing HPP attacks while still allowing valid queries to pass normally.

---

### ADDITIONAL FEATURES

#### 1. Enhanced HSTS

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts(hsts => hsts.MaxAge(days: 365).IncludeSubdomains().Preload());
}
```

**What it does:**

* Enforces HTTPS for a year
* Applies to subdomains
* Adds preload hint to browsers
* Strengthens TLS enforcement

---

#### 2. Rate-Limiting Headers

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.Headers.Add("Retry-After", "300");
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"message\":\"Too many requests. Please try again later.\"}", token);
    };
});
```

**What it does:**

* Limits login/register endpoint requests
* Returns `429 Too Many Requests`
* Includes `Retry-After` headers
* Helps prevent brute-force attacks

---

## References

SonarSource (2025). *Getting Started with SonarQube Cloud: A Developer’s Guide.*
[https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/](https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/)
Accessed 7 Nov. 2025.
