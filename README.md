# Multi-Site Documentation Server

A TypeScript-based Model Context Protocol (MCP) server that provides tools for fetching and searching documentation from multiple documentation sites:

- **Module Federation** - https://module-federation.io
- **Modern.js** - https://modernjs.dev
- **Firebase** - https://firebase.google.com/docs

**🚀 Now supports Firebase App Hosting!** Deploy your MCP server to the cloud with SSE transport. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.

## Features

This server exposes three tools for accessing documentation from any supported site:

1. **fetch_doc_index** - Fetches the complete documentation index from a specified site
2. **fetch_doc_page** - Fetches content from a specific documentation page
3. **search_docs** - Searches for terms across the documentation content

All tools support a `site` parameter to specify which documentation site to query (default: "module-federation").

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage

### With Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "multi-site-documentation-server": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/MCP-Test/build/index.js"]
    }
  }
}
```

### With VS Code

The server can be debugged in VS Code using the MCP configuration in `.vscode/mcp.json`. Open this folder in VS Code with the GitHub Copilot extension installed.

### Direct Usage

You can also run the server directly:

```bash
node build/index.js
```

## Tools

### fetch_doc_index

Retrieves the complete documentation index.

**Parameters**:

- `site` (optional): The documentation site to query - "module-federation" or "modernjs" (default: "module-federation")

**Usage in Claude**:

- "Get the Module Federation documentation index"
- "Show me the Modern.js docs index"
- "Fetch the documentation index"

### fetch_doc_page

Fetches a specific documentation page.

**Parameters**:

- `url`: The URL or path to fetch (can be full URL or relative path)
- `site` (optional): The documentation site (default: "module-federation")

**Usage in Claude**:

- "Get the Module Federation config docs"
- "Show me /docs/guides/intro from Modern.js"
- "Fetch the deployment guide"

### search_docs

Searches for a term in the documentation.

**Parameters**:

- `query`: The search term
- `site` (optional): The documentation site (default: "module-federation")
- `caseInsensitive` (optional): Whether to search case-insensitively (default: true)

**Usage in Claude**:

- "Find information about 'federation' in Module Federation docs"
- "Search Modern.js for 'routing'"
- "Search for 'configuration' in the docs"

## Development

### Watch Mode

```bash
npm run watch
```

### Project Structure

```
.
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── .vscode/
│   └── mcp.json         # VS Code MCP configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Debugging in VS Code

1. Open this folder in VS Code
2. Make sure the GitHub Copilot extension is installed
3. The server will be available in Copilot's MCP servers list
4. You can view logs in the Output panel (select "MCP: mcp-documentation-server" from the dropdown)

## License

MIT
