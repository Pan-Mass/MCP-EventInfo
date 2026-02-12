#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Multi-Site Documentation Server
 * Provides tools to fetch and search documentation from multiple sites:
 * - Module Federation
 * - Modern.js
 * - Firebase
 */

// Supported documentation sites
interface DocSite {
  name: string;
  baseUrl: string;
  indexPath: string;
}

const DOC_SITES: Record<string, DocSite> = {
  "module-federation": {
    name: "Module Federation",
    baseUrl: "https://module-federation.io",
    indexPath: "/llms.txt",
  },
  modernjs: {
    name: "Modern.js",
    baseUrl: "https://modernjs.dev",
    indexPath: "/llms.txt",
  },
  firebase: {
    name: "Firebase",
    baseUrl: "https://firebase.google.com/docs",
    indexPath: "/llms.txt",
  },
};

const VALID_SITES = Object.keys(DOC_SITES).join(", ");

// Helper function to fetch content from a URL
async function fetchContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch from ${url}: ${errorMessage}`);
  }
}

// Create server instance
const server = new McpServer({
  name: "multi-site-documentation-server",
  version: "1.0.0",
});

/**
 * Tool 1: Fetch Documentation Index
 * Retrieves the complete documentation index from llms.txt
 */
server.registerTool(
  "fetch_doc_index",
  {
    description:
      `Fetches the complete documentation index for a specified site. ` +
      `Supported sites: ${VALID_SITES}. ` +
      "The index contains a structured overview of all available documentation pages. " +
      "Use this to discover available documentation before fetching specific pages.",
    inputSchema: {
      site: z
        .enum(["module-federation", "modernjs", "firebase"])
        .default("module-federation")
        .describe(
          `The documentation site to fetch from. Options: ${VALID_SITES} (default: module-federation)`,
        ),
    },
  },
  async ({ site }) => {
    try {
      const docSite = DOC_SITES[site];
      if (!docSite) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown site "${site}". Valid sites are: ${VALID_SITES}`,
            },
          ],
          isError: true,
        };
      }

      const indexUrl = `${docSite.baseUrl}${docSite.indexPath}`;
      const content = await fetchContent(indexUrl);
      return {
        content: [
          {
            type: "text",
            text: `Documentation index for ${docSite.name}:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool 2: Fetch Documentation Page
 * Retrieves content from a specific documentation page
 */
server.registerTool(
  "fetch_doc_page",
  {
    description:
      "Fetches content from a specific documentation page. " +
      "Provide either a full URL or a relative path (e.g., '/docs/concepts/architecture'). " +
      "Use fetch_doc_index first to discover available pages.",
    inputSchema: {
      url: z
        .string()
        .describe(
          "The URL or path to fetch. Can be a full URL (https://...) or relative path (/docs/...)",
        ),
      site: z
        .enum(["module-federation", "modernjs", "firebase"])
        .default("module-federation")
        .describe(
          `The documentation site (used for relative paths). Options: ${VALID_SITES} (default: module-federation)`,
        ),
    },
  },
  async ({ url, site }) => {
    try {
      const docSite = DOC_SITES[site];
      if (!docSite) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown site "${site}". Valid sites are: ${VALID_SITES}`,
            },
          ],
          isError: true,
        };
      }

      // Normalize the URL
      let fetchUrl: string;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        fetchUrl = url;
      } else if (url.startsWith("/")) {
        fetchUrl = `${docSite.baseUrl}${url}`;
      } else {
        fetchUrl = `${docSite.baseUrl}/${url}`;
      }

      const content = await fetchContent(fetchUrl);
      return {
        content: [
          {
            type: "text",
            text: `Content from ${fetchUrl} (${docSite.name}):\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool 3: Search Documentation
 * Searches for a term in the documentation index
 */
server.registerTool(
  "search_docs",
  {
    description:
      "Searches for a term in a documentation site's index. " +
      "Returns matching sections from the index with context. " +
      "Useful for finding specific topics or features in the documentation.",
    inputSchema: {
      query: z
        .string()
        .describe("The search term or phrase to look for in the documentation"),
      site: z
        .enum(["module-federation", "modernjs", "firebase"])
        .default("module-federation")
        .describe(
          `The documentation site to search. Options: ${VALID_SITES} (default: module-federation)`,
        ),
      caseInsensitive: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to perform case-insensitive search (default: true)"),
    },
  },
  async ({ query, site, caseInsensitive }) => {
    try {
      const docSite = DOC_SITES[site];
      if (!docSite) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown site "${site}". Valid sites are: ${VALID_SITES}`,
            },
          ],
          isError: true,
        };
      }

      const indexUrl = `${docSite.baseUrl}${docSite.indexPath}`;
      const indexContent = await fetchContent(indexUrl);
      const lines = indexContent.split("\n");
      const matches: string[] = [];

      const searchQuery = caseInsensitive ? query.toLowerCase() : query;

      lines.forEach((line, index) => {
        const searchLine = caseInsensitive ? line.toLowerCase() : line;
        if (searchLine.includes(searchQuery)) {
          // Add context: previous line, matching line, next line
          const context: string[] = [];
          if (index > 0) context.push(lines[index - 1]);
          context.push(lines[index]);
          if (index < lines.length - 1) context.push(lines[index + 1]);
          matches.push(context.join("\n"));
        }
      });

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No matches found for "${query}" in the ${docSite.name} documentation index.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found ${matches.length} match${matches.length === 1 ? "" : "es"} for "${query}" in ${docSite.name}:\n\n${matches.join("\n---\n")}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout, which is used for MCP communication)
  console.error("Multi-Site Documentation Server running on stdio");
  console.error("Supported sites:", VALID_SITES);
  console.error("Available tools:");
  console.error("  - fetch_doc_index: Get the documentation index for a site");
  console.error("  - fetch_doc_page: Fetch a specific documentation page");
  console.error("  - search_docs: Search documentation");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
