# Contributing to Aave Liquidation MCP

First off, thank you for considering contributing to Aave Liquidation MCP! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Environment details** (Node version, OS, RPC provider)
- **Error messages** or logs

**Template:**
```markdown
**Description:**
A clear description of what the bug is.

**To Reproduce:**
1. Configure MCP with...
2. Call tool '...'
3. See error

**Expected behavior:**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 14.0]
- Node version: [e.g. 18.17.0]
- MCP SDK version: [e.g. 1.0.4]

**Additional context:**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear description** of the enhancement
- **Use case** - why is this needed?
- **Proposed solution** - how should it work?
- **Alternatives considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** - ensure the build passes
4. **Update documentation** if needed
5. **Write a clear commit message**
6. **Submit a pull request**

#### Pull Request Guidelines

- Follow the existing code style
- Write clear, concise commit messages
- Update README.md if adding new features
- Add tests if possible
- Ensure all tests pass: `npm run build`
- Keep PRs focused - one feature/fix per PR

### Coding Standards

**TypeScript:**
- Use TypeScript for all new code
- Follow existing code structure
- Add JSDoc comments for public functions
- Use meaningful variable and function names
- Prefer `const` over `let`

**Example:**
```typescript
/**
 * Get user account health factor
 * @param userAddress - Ethereum address to check
 * @returns Account data including health factor
 */
async getUserHealth(userAddress: string): Promise<AccountData> {
  // Implementation
}
```

**Error Handling:**
- Use try-catch for async operations
- Throw `McpError` with appropriate error codes
- Provide helpful error messages

**Code Organization:**
- Keep functions focused and small
- Group related functionality
- Export only what's needed
- Use barrel exports when appropriate

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs when relevant

**Examples:**
```
Add batch address checking functionality

Implement validate_address tool

Fix health factor calculation for edge cases

Update README with new tool documentation
```

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aave-liquidation-mcp.git
   cd aave-liquidation-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Add your RPC URL to .env
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Make your changes in `src/`

6. Test your changes:
   ```bash
   npm run build
   # Test with Claude Desktop or your own MCP client
   ```

### Testing

Currently, testing is done manually with Claude Desktop. We welcome contributions to add automated testing!

**Manual testing checklist:**
- [ ] Build completes without errors
- [ ] All tools return expected data format
- [ ] Error cases are handled properly
- [ ] Documentation is updated

### Project Structure

```
aave-liquidation-mcp/
├── src/
│   ├── index.ts           # MCP server and tool definitions
│   ├── aave-client.ts     # Aave protocol interaction
│   ├── constants.ts       # Contract addresses and ABIs
│   └── types.ts           # TypeScript types
├── build/                 # Compiled output
├── docs/                  # Documentation
└── tests/                 # Tests (coming soon)
```

### Areas for Contribution

We're especially looking for help with:

- **Multi-chain support** - Add support for Arbitrum, Optimism, Base, Polygon
- **Testing** - Add unit and integration tests
- **Documentation** - Improve examples and tutorials
- **Performance** - Optimize RPC calls and caching
- **Features** - See open issues for feature requests
- **Analytics** - Add historical data analysis
- **UI/Dashboard** - Web interface for monitoring

### Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by opening an issue or contacting the project maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the README.md file. Thank you for your contributions! 🙏
