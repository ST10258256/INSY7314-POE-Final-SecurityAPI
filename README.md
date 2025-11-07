# INSY7314-POE-Final-SecurityAPI

---

## Overview of the App

- Links

 Project running on render : https://securityapi-site.onrender.com 
 
 Youtube video of demonstrations: https://youtube.com/playlist?list=PLsae_Ukb8pwZw0d-o2HTyf3P97-1aT4ZC&si=Evr8WLWWqUVWHLRy


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











  <img width="940" height="351" alt="image" src="https://github.com/user-attachments/assets/002f2085-08e0-436a-b0b7-201af34a1f53" />
Pipeline: 
okay so basically this is our GitHub pipeline, and it’s showing that all four checks have passed. that means everything ran successfully , no broken builds, no failed tests, no security issues detected. here’s what each one actually checks for:
1. CodeQL / Analyze (CodeQL) (push)
This one is a security and code analysis tool from GitHub. it scans the codebase to detect potential vulnerabilities or unsafe patterns.
it looks for things like:
•	SQL injections
•	cross-site scripting (XSS)
•	insecure data handling
•	logic errors that could lead to security issues
So if CodeQL passes, it basically means it didn’t find any major security red flags in your code when you pushed the commit.
2. SonarCloud Code Analysis
This one is about code quality and maintainability, not just security.
SonarCloud checks for:
•	bugs and potential runtime issues
•	code smells (bad practices that could cause problems later)
•	duplicated code
•	test coverage levels
•	and whether the code passes the “Quality Gate,” which is SonarCloud’s way of saying “your code meets the minimum quality standards.”
since it says “Quality Gate passed,” your code met the required quality metrics ,so that’s a good sign that it’s clean, maintainable, and consistent.
3. ci/circleci: sonarcloud-analysis
This is the CircleCI job that actually runs the SonarCloud analysis.
it handles the pipeline execution part , so it’s CircleCI running the analysis script that uploads results to SonarCloud. if this passed, it means the build, test, and analysis steps all completed successfully on CircleCI’s servers.
in short, CircleCI did its job, built your code, and sent the analysis data without any errors.
4. ci/circleci: trivy-scan
This one uses Trivy, which is a vulnerability scanner for containers and dependencies.
it scans your project for:
•	known vulnerabilities in dependencies
•	insecure or outdated packages
•	misconfigurations in Docker images or environment files
So when this passes, it means there are no critical or high vulnerabilities found in your dependencies or container image.
Overall meaning:
“All checks have passed” means your code passed all the key stages of automated quality assurance:
•	no security issues (CodeQL)
•	good quality code (SonarCloud)
•	build and tests ran successfully (CircleCI)
•	no known vulnerabilities (Trivy)


---

## References

SonarSource (2025). *Getting Started with SonarQube Cloud: A Developer’s Guide.*
[https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/](https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/)
Accessed 7 Nov. 2025.
