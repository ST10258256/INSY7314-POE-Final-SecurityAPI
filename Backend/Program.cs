using Backend.Repositories;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.AspNetCore.Http;
using NWebsec.AspNetCore.Middleware;
using Backend.Middleware;


// Load .env file for local development
Env.Load();
Console.WriteLine(Environment.GetEnvironmentVariable("JWT_KEY"));

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear(); 

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(options =>
{
    // login only allows 5 requests every 5 minutes
    options.AddFixedWindowLimiter("login", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(5);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });

    // register only allows 3 requests every 10 minutes
    options.AddFixedWindowLimiter("register", o =>
    {
        o.PermitLimit = 3;
        o.Window = TimeSpan.FromMinutes(10);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });

    // custom rejection response
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"message\":\"Too many requests. Please try again later.\"}", token);
    };
});

// Load SSL Certificate 
X509Certificate2? certificate = null;

// Check for Render environment variables
var certB64 = Environment.GetEnvironmentVariable("CERT_PEM");
var keyB64 = Environment.GetEnvironmentVariable("KEY_PEM");

if (!string.IsNullOrEmpty(certB64) && !string.IsNullOrEmpty(keyB64))
{
    // Decode Base64 and create certificate
    var certPem = Encoding.UTF8.GetString(Convert.FromBase64String(certB64));
    var keyPem = Encoding.UTF8.GetString(Convert.FromBase64String(keyB64));

    certificate = X509Certificate2.CreateFromPem(certPem, keyPem);
    certificate = new X509Certificate2(certificate.Export(X509ContentType.Pfx));
}
else if (File.Exists("cert.pem") && File.Exists("key.pem"))
{
    // Local development
    certificate = X509Certificate2.CreateFromPemFile("cert.pem", "key.pem");
    certificate = new X509Certificate2(certificate.Export(X509ContentType.Pfx));
}
else
{
    Console.WriteLine("No SSL certificate found. HTTPS will not work.");
}

// Configure Kestrel 
var renderPort = Environment.GetEnvironmentVariable("PORT") ?? "5162";
int.TryParse(renderPort, out var portToUse);
if (portToUse == 0) portToUse = 5162;

builder.WebHost.ConfigureKestrel(options =>
{
    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT")))
    {
        // Local development: use HTTPS
        if (File.Exists("cert.pem") && File.Exists("key.pem"))
        {
            var certificate = X509Certificate2.CreateFromPemFile("cert.pem", "key.pem");
            certificate = new X509Certificate2(certificate.Export(X509ContentType.Pfx));

            options.ListenAnyIP(portToUse, listenOptions =>
            {
                listenOptions.UseHttps(certificate); // HTTPS locally
            });
        }
        else
        {
            // fallback to HTTP if certs not found
            options.ListenAnyIP(portToUse);
        }
    }
    else
    {
        // On Render: bind to Render's PORT (HTTP)
        options.ListenAnyIP(portToUse);
    }
});




//  MongoDB & Repositories 
var mongoConnection = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING");
var mongoDbName = Environment.GetEnvironmentVariable("MONGO_DATABASE_NAME");

builder.Services.AddSingleton<IMongoDbContext>(sp =>
    new MongoDbContext(mongoConnection!, mongoDbName!)
);

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<PaymentRepository>();

// ---------- JWT ----------
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")!;
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
var key = new SymmetricSecurityKey(keyBytes);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
        ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
        IssuerSigningKey = key,
        RoleClaimType = "https://schemas.microsoft.com/ws/2008/06/identity/claims/role" 
    };
});

//Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Banking API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// CORS 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactLocal", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://localhost:5173",
            "http://localhost:5174",
            "https://localhost:5174",
            "https://securityapi-x4rg.onrender.com",
            "https://securityapi-site.onrender.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCsp(options => options
    .DefaultSources(s => s.Self())
    .ScriptSources(s => s.Self())
    .StyleSources(s => s.Self())
);


app.UseRateLimiter();

app.UseCors("AllowReactLocal");
app.UseSecurityHeaders();
// Middleware 
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}



app.UseHttpsRedirection();
app.UseCors("AllowReactLocal");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Banking API V1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();




app.Run();
