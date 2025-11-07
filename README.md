# INSY7314-POE-Final-SecurityAPI

---

## Overview of the app

SecurityAPI is a web application built using:

* Backend: ASP.NET Core Web API (C#)

* Frontend: React + Vite

* Database: MongoDB

* Hosting: Render for the backend; local for the frontend but there is also an option for Render on frontend

The system provides secure user authentication using JWT, API communication, and frontend UI.

## Here is a guide for the developers on the app on how to operate: [GUIDE.md](https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI/blob/main/GUIDE.md)

---

## Features

* User Authentication
* JWT Token Generation and secure authorization
* Cross-Origin Resource Sharing configured for HTTPS
* Environment-based configuration
* MongoDB integration for data storage
* React + Vite frontend with secure HTTPS
* Rate limiting is implemented
* CSP is also implemented
* Idle session timeouts implemented for session hijacking protection
* SonarQube was used to test security (SonarSource, 2025)

---

## How to get started using our app

1. You will have to clone or fork the repo

```bash
git clone https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI.git
```

2. The project should work from here, but since you are using local you will have to make your own certificate. The site is secure as Render passes everything already with SSL — go to step 15 if you do not mind.

```bash
  choco install mkcert -y
```

3. Then you will have to install it

```bash
  mkcert -install
```

4. Then in the local folders for frontend you will have to make a certificate for your localhost. This can be done as follows:

```bash
  cd Frontend
  mkcert localhost 127.0.0.1 ::1
```

5. Then you have to trust the certificate you just made.

6. Press **Windows + R** and then type in:

```bash
  certmgr.msc
```

7. Go to the folder on the left called **Trusted Root Certification Authorities**.

8. Right-click the **Certificates** folder → **All Tasks → Import**

9. Go to where you installed the `rootCA.pem` and import that file. It will probably be in `Users/YourUser/AppData/mkcert`. If you can’t find it, change the file view to *All Files*.

10. Click **Next**.

11. Then choose **Place all certificates in the following store → Trusted Root Certification Authorities**.

12. Click **Next** and finish the wizard.

13. Clear your cache and restart your browser — it should now work.

14. Once you have done these steps you will be able to run the frontend, but you can run the frontend even if you don’t mind the certificate warnings.

```bash
cd Frontend
```

15. Once you have done that you will have to run the frontend

```bash
npm run dev
```

16. Click on the link it gives you.

17. This will take you to your localhost on the webpage.

18. This is all done over SSL and the backend is being hosted over Render, so you will not have to run anything else.

19. Now you can interact with the app and make an account, login, make payments and view the payments that you have made.

---

### Running backend locally

1. Follow the steps previously and once you have cloned the repo you must run your backend, so use this code:

```bash
cd Backend
dotnet build
dotnet run
```

2. Once this is done you will be running your backend locally instead, and then you will have to follow the rest of the steps.

---

### Creating your own database

If you want to make your own you will need to create environment variables with the required information:

```bash
MONGO_URI=<connection string>
MONGO_DATABASE_NAME=<database name>

JWT_KEY=<your key>
JWT_ISSUER=<issuer>
JWT_EXPIREMINUTES=<expiry time in minutes>
```

---

## Software used in this project

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

### 1. Serve all traffic over SSL

**Code where it happens:**

```csharp
options.ListenAnyIP(portToUse, listenOptions =>
{
    listenOptions.UseHttps(certificate); // HTTPS locally
});
```

**Explanation:**
This configuration ensures all traffic to the API is encrypted via HTTPS.
Locally, Kestrel uses the specified SSL certificate to serve HTTPS requests.
In production (Render), HTTPS is handled by the platform’s reverse proxy, ensuring secure data in transit.

---

### 2. Redirect HTTP → HTTPS

**Code where it happens:**

```csharp
app.UseHttpsRedirection();
```

**Explanation:**
This middleware automatically redirects any HTTP request to HTTPS.
This ensures that all clients connect securely and prevents unencrypted traffic from reaching the API.

---

### 3. Apply HSTS (Strict Transport Security)

**Code where it happens:**

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
```

**Explanation:**
HSTS instructs browsers to always use HTTPS when communicating with the API.
This prevents downgrade attacks and ensures clients never access the API over an unencrypted connection in production environments.

---

### 4. Secure cookies, SameSite, and HttpOnly flags

**Implementation:** Not applicable

**Explanation:**
This API uses **JWT-based stateless authentication**, so no cookies or session state are used.
The `secure`, `sameSite`, and `httpOnly` flags apply only to cookie-based authentication.
JWT tokens are sent in headers, so these flags are not needed.

---

### 5. Stricter CORS Policy

**Code where it happens:**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("SecureCorsPolicy", policy =>
    {
        policy.WithOrigins("https://yourfrontenddomain.com")
              .WithMethods("GET", "POST", "PUT", "DELETE")
              .WithHeaders("Content-Type", "Authorization")
              .AllowCredentials();
    });
});
```

**Explanation:**
A stricter CORS policy has been implemented to only allow specific headers, methods, and origins.
This reduces the attack surface and ensures only trusted domains can communicate with the API.

---

### 6. HTTP Parameter Pollution (HPP) Protection

**Code where it happens:**

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
HPP (HTTP Parameter Pollution) protection middleware was added to prevent malicious query parameter duplication.
This ensures requests are validated before reaching the main middleware pipeline.

---

### ADDITIONAL FEATURES

#### 1. HSTS (HTTP Strict Transport Security) Enhancement

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts(hsts => hsts.MaxAge(days: 365).IncludeSubdomains().Preload());
}
```

**What it does:**

1. Enforces HTTPS for all browser requests for 1 year.
2. Applies to all subdomains.
3. Signals browsers to preload this site in their HSTS lists.
4. Fully additive and does not interfere with existing HTTPS, JWT, or middleware logic.

---

#### 2. Rate-Limiting Headers

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Custom rejection response
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

1. Limits requests to endpoints (login and register) to prevent brute-force attacks.
2. Sends `Retry-After` headers to clients, indicating when they can retry.
3. Returns a clear 429 response with a JSON message.
4. Fully additive and does not interfere with existing JWT authentication or other middleware.

---

## References

SonarSource (2025). Getting Started with SonarQube Cloud: A Developer’s Guide. [online] Sonarsource.com. Available at: [https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/](https://www.sonarsource.com/resources/library/getting-started-with-sonarqube-cloud/) [Accessed 7 Nov. 2025].
