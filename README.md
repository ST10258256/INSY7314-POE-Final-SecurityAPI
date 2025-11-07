# INSY7314-POE-Final-SecurityAPI

---
## Overview of the app
SecurityAPI is a web application built using:

- Backend: ASP.NET Core Web API (C#)

- Frontend: React + Vite

- Database: MongoDB

- Hosting: Render for the backend; local for the frontend

The system provides secure user authentication using JWT, API communication, and frontend UI.


## Here is a guide for the devlopers on the app on how to operate: [GUIDE.md](https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI/blob/main/GUIDE.md)

---

## Features

- User Authentication

- JWT Token Generation and secure authorization

- Cross-Origin Resource Sharing configured for HTTPS

- Environment-based configuration

- MongoDB integration for data storage

- React + Vite frontend with secure HTTPS

- Rate limiting is implemented

- CSP is also Implemented

- Idle session timeouts implemented for seession jacking

---

## How to get started using our app

1. You will have to clone or fork the repo

```bash
git clone https://github.com/ST10258256/INSY7314-POE-PART_TWO-SecurityAPI.git
```

2.The project should work from here but there since you are using local you will have to make your own certificate but the site is secure as render passes everything already with ssl, go to step 15 if you do not mind

```bash
  choco install mkcert -y
```

3. Then you will have to install it 

```bash
  mkcert -install
```

4. Then in the local folders for frontend you will have make a certificate for your localhost this can be done as follows

```bash
  cd Frontend
  mkcert locahost 127.0.0.1 :: 1
```

5. Then you have to trust the certificate you just made

6. So click windows + r ; and then type in 

```bash
  certmgr.msc
```

7. You will jabe to go to the file on the left callled Trusted Root Certification Authorities.

8. Right Click The certificate foolder and then all tasks and then import

9. Go to where you installed the rootCA.pem and import that file. it probably be be in users/youruser/AppData/mkcert. If you are struggling to find it in that folder change the view to all files

10. You will click that then press next 

11. And then for the next option we will use Place all certificates in the following store in Trusted Root Certifcation Authorities

12. Click next and then it should be finished

13. You will have to clear your cache and restart your browser  and then it should work


14. Once you have done these steps you will be able to run the Frontend but you can run the frontend if you don't mind the frontend Certificate issues

```bash
cd Frontend
```

15. Once you have done that you will have to run the frontend

```bash
npm run dev
```

16. Click on the link it gives you
    
17. This will take you to your localhost on the webpage

19. This is all done over ssl and the backend is being hosted over render so you will not have to run anything else
  
21. Now you can interact with the app and make an account; login; make payments and view the payments that you have made

### Running backend locally

1. Follow the steps previously and once you have cloned the repo you must run your backend so use this code

```bash
cd Backend
dotnet build
dotnet run

```

2. Once this is done you will be running your backend locally instead and then you will have to follow the rest of the steps

### Creating your own database

If you want to make your own you will need to create a environment variable with the required information 

```bash
MONGO_URI= <connection string>
MONGO_DATABASE_NAME=<datbase name>

JWT_KEY=<yourkey>
JWT_ISSUER=<who issued it>
JWT_EXPIREMINUTES<giver expirey date>
```

---

## Software used in this project

- npm
- Render
- Swagger
- MongoDB
- React + Vite
- Docker
- JWT
- CSP

## Feedback Implemented

### 1. Serve all traffic over SSL

**Code Snippet:**

```csharp
options.ListenAnyIP(portToUse, listenOptions =>
{
    listenOptions.UseHttps(certificate); // HTTPS locally
});
Explanation:
This configuration ensures all traffic to the API is encrypted via HTTPS.
Locally, Kestrel uses the specified SSL certificate to serve HTTPS requests.
In production (Render), HTTPS is handled by the platform’s reverse proxy,
ensuring secure data in transit.

```

### 2. Redirect HTTP → HTTPS

**Code Snippet:**

```csharp
app.UseHttpsRedirection();
Explanation:
This middleware automatically redirects any HTTP request to HTTPS.
This ensures that all clients connect securely and prevents unencrypted
traffic from reaching the API.
```

### 3. Apply HSTS (Strict Transport Security)

**Code Snippet:**

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
Explanation:
HSTS instructs browsers to always use HTTPS when communicating with the API.
This prevents downgrade attacks and ensures clients never access the API
over an unencrypted connection in production environments.
```

### 4. Secure cookies, SameSite, and HttpOnly flags

**Implementation:** Not applicable

**Explanation:**  
This API uses **JWT-based stateless authentication**, 
so no cookies or session state are used.  
The `secure`, `sameSite`, and `httpOnly` flags 
apply only to cookie-based authentication. 
JWT tokens are sent in headers, so these flags are not needed.

### ADDITIONAL FEATURES

---

#### 1. HSTS (HTTP Strict Transport Security) Enhancement
```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts(hsts => hsts.MaxAge(days: 365).IncludeSubdomains().Preload());
}
What it does:

Enforces HTTPS for all browser requests for 1 year.

Applies to all subdomains.

Signals browsers to preload this site in their HSTS lists.

Fully additive and does not interfere with existing HTTPS, JWT, or middleware logic.
```

2. Rate-Limiting Headers
csharp
Copy code
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
What it does:

Limits requests to endpoints (login and register) to prevent brute-force attacks.

Sends Retry-After headers to clients, indicating when they can retry.

Returns a clear 429 response with JSON message.

Fully additive and does not interfere with existing JWT authentication or other middleware.
