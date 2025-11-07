# INSY7314-POE-Final-SecurityAPI

---

## Overview of the app

SecurityAPI is a web application built using:

* **Backend:** ASP.NET Core Web API (C#)
* **Frontend:** React + Vite
* **Database:** MongoDB
* **Hosting:** Render for the backend; local for the frontend but also deployable to Render

The system provides secure user authentication using JWT, API communication, and a React-based frontend UI.

## Developer Guide

[GUIDE.md](https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI/blob/main/GUIDE.md)

---

## Features

* User Authentication (JWT)
* Secure Authorization
* Cross-Origin Resource Sharing configured for HTTPS
* Environment-based configuration
* MongoDB integration for data storage
* React + Vite frontend with HTTPS support
* Rate Limiting implemented
* CSP (Content Security Policy) implemented
* Idle session timeout for hijacking prevention
* SonarQube used for vulnerability testing (SonarSource, 2025)

---

## How to Get Started

1. Clone or fork the repo:

```bash
git clone https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI.git
```

2. If working locally, generate an SSL certificate (Render already handles this):

```bash
choco install mkcert -y
mkcert -install
cd Frontend
mkcert localhost 127.0.0.1 ::1
```

3. Import the certificate:

   * Press **Windows + R → certmgr.msc**
   * Go to **Trusted Root Certification Authorities → Certificates**
   * **Right-click → All Tasks → Import**
   * Locate your `rootCA.pem` (in `Users/YourUser/AppData/mkcert`)
   * Complete the import wizard and restart your browser.

4. Run the frontend:

```bash
cd Frontend
npm run dev
```

5. Click the localhost link shown in your terminal.
   You’ll be able to register, log in, make payments, and view them.

---

### Running Backend Locally

```bash
cd Backend
dotnet build
dotnet run
```

---

### Environment Variables

If you create your own database:

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
Ensures all traffic is encrypted via HTTPS. Locally handled by Kestrel, and in production, Render provides SSL by default.

---

### 2. Redirect HTTP → HTTPS

```csharp
app.UseHttpsRedirection();
```

**Explanation:**
Forces all traffic to HTTPS to prevent unencrypted requests.

---

### 3. Apply HSTS (Strict Transport Security)

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
```

**Explanation:**
Tells browsers to always connect via HTTPS, preventing downgrade attacks.

---

### 4. Secure Cookies, SameSite, and HttpOnly Flags

**Not applicable:**
JWT tokens are sent in headers, so cookie flags aren’t relevant.

---

### 5. Stricter CORS Policy

**Code where it happens:**

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
Only trusted domains, headers, and methods are allowed. This reduces the attack surface and ensures that only approved clients can communicate with the API.

---

### 6. HTTP Parameter Pollution (HPP) Protection

```csharp
app.Use(async (context, next) =>
{
    var query = context.Request.Query;
    var hasDuplicateKeys = query.GroupBy(q => q.Key)
                                .Any(g => g.Count() > 1);

    if (hasDuplicateKeys)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Bad Request - HPP detected.");
        return;
    }

    await next();
});
```

**Explanation:**
Detects and blocks duplicate query parameters to prevent HPP attacks.

---

### ADDITIONAL FEATURES

#### 1. HSTS Enhancement

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts(hsts => hsts.MaxAge(days: 365).IncludeSubdomains().Preload());
}
```

**What it does:**

* Enforces HTTPS for 1 year
* Applies to subdomains
* Signals browsers to preload the rule
* Adds layered protection without interfering with other security logic

---

#### 2. Rate-Limiting Headers

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.Headers.Add("Retry-After", "300"); // seconds
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"message\":\"Too many requests. Please try again later.\"}", token);
    };
});
```

**What it does:**

* Limits requests to critical endpoints (e.g., login/register)
* Sends `Retry-After` headers
* Prevents brute-force attacks
* Returns clear `429 Too Many Requests` responses

---

## References

SonarSource (2025). *Getting Started with SonarQube Cloud: A Developer’s Guide.*
[https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/](https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/)
Accessed 7 Nov. 2025.
