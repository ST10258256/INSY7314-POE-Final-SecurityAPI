using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Backend.Middleware
{
    // source reference: https://www.roundthecode.com/dotnet-tutorials/add-request-logging-database-asp-net-core-web-api
    public class SuspiciousRequestLogging
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SuspiciousRequestLogging> _logger;

        public SuspiciousRequestLogging(RequestDelegate next, ILogger<SuspiciousRequestLogging> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var request = context.Request;
            var ip = context.Connection.RemoteIpAddress?.ToString();

            await _next(context);
            stopwatch.Stop();

            //get response details: how long the request took and status code
            var elapsed = stopwatch.ElapsedMilliseconds;
            var statusCode = context.Response.StatusCode;

            //log failed or sucspicious requests
            if (statusCode == 401 || statusCode == 403)
            {
                //
                _logger.LogWarning("Suspicious request detected: {Method} {Path} from {IP} returned {StatusCode}",
                    request.Method, request.Path, ip, statusCode);
            }
            else if (stopwatch.ElapsedMilliseconds < 10 && request.Method != "GET")
            {
                _logger.LogWarning("Suspiciously fast request: {Method} {Path} from {IP} completed in {Time}ms",
                    request.Method, request.Path, ip, stopwatch.ElapsedMilliseconds);
            }
            else if (request.Method == "DELETE" || request.Method == "PUT")
            {
                _logger.LogInformation("High-risk method used: {Method} {Path} from {IP}", request.Method, request.Path, ip);
            }
        }
    }
}
