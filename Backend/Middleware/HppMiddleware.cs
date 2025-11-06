using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Backend.Middleware
{
    // Prevents HTTP Parameter Pollution attacks
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
}
