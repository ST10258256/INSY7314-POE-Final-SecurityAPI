using Backend.Models;
using Backend.Repositories;
using FluentAssertions;
using MongoDB.Driver;
using Testcontainers.MongoDb;
using Xunit;

namespace IntegrationTests.Repositories
{
    public class UserRepositoryIntegrationTests : IAsyncLifetime
    {
        private readonly MongoDbContainer _mongoContainer;
        private UserRepository _repository = null!;

        public UserRepositoryIntegrationTests()
        {
            _mongoContainer = new MongoDbBuilder()
                .WithImage("mongo:7")
                .WithCleanUp(true)
                .Build();
        }

        public async Task InitializeAsync()
        {
            await _mongoContainer.StartAsync();

            var client = new MongoClient(_mongoContainer.GetConnectionString());
            var database = client.GetDatabase("TestDb");

            var mockContext = new TestMongoDbContext(database);
            _repository = new UserRepository(mockContext);
        }

        public async Task DisposeAsync()
        {
            await _mongoContainer.DisposeAsync();
        }

        [Fact]
        public async Task CreateAsync_And_GetByEmailAsync_ShouldReturnTheSameUser()
        {
            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = "test@example.com",
                AccountNumber = "ACC123",
                Name = "Test User"
            };

            await _repository.CreateAsync(user);

            var result = await _repository.GetByEmailAsync("test@example.com");

            result.Should().NotBeNull();
            result!.Email.Should().Be("test@example.com");
            result.AccountNumber.Should().Be("ACC123");
        }
    }

    // Helper class replacing your IMongoDbContext
    public class TestMongoDbContext : IMongoDbContext
    {
        public TestMongoDbContext(IMongoDatabase database)
        {
            Users = database.GetCollection<User>("Users");
        }

        public IMongoCollection<User> Users { get; }
    }
}
