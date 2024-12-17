import path from "path";
import { createReadStream, promises as fs } from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import rehypeKatex from 'rehype-katex'
import { visit } from "unist-util-visit";

import { PageRoutes } from "@/lib/pageroutes";
import { components } from '@/lib/components'; 
import { Settings } from "@/lib/meta";
import { GitHubLink } from "@/settings/navigation";

// Constants
const headingsRegex = /^(#{2,4})\s(.+)$/gm;

function normalizeSlug(slug: string): string {
  // Remove leading/trailing slashes and handle empty strings
  if (!slug) return '';
  
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  if (!cleanSlug) return '';
  
  // Split and filter out empty segments
  const segments = cleanSlug.split('/').filter(Boolean);
  const uniqueSegments = segments.reduce((acc: string[], segment) => {
    // Only add if different from last segment
    if (!acc.length || acc[acc.length - 1] !== segment) {
      acc.push(segment);
    }
    return acc;
  }, []);
  
  return uniqueSegments.join('/');
}

async function parseMdx<Frontmatter>(rawMdx: string) {
  return await compileMDX<Frontmatter>({
    source: rawMdx,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          preCopy,
          rehypeCodeTitles,
          rehypeKatex,
          rehypePrism,
          rehypeSlug,
          rehypeAutolinkHeadings,
          postCopy,
        ],
        remarkPlugins: [remarkGfm],
      },
    },
    components,
  });
}

type BaseMdxFrontmatter = {
  title: string;
  description: string;
  keywords: string;
};

function getDocumentPath(slug: string): string {
  const normalized = normalizeSlug(slug);
  if (!normalized) {
    throw new Error('Invalid slug provided');
  }
  
  return Settings.gitload
    ? `${GitHubLink.href}/raw/main/contents/docs/${normalized}/index.mdx`
    : path.join(process.cwd(), "contents/docs", normalized, "index.mdx");
}

// Memoized version of getDocumentPath
const getDocumentPathMemoized = (() => {
  const cache = new Map<string, string>();
  return (slug: string): string => {
    const normalized = normalizeSlug(slug);
    if (!cache.has(normalized)) {
      cache.set(normalized, getDocumentPath(normalized));
    }
    return cache.get(normalized)!;
  };
})();

export async function getDocument(slug: string) {
  try {
    const contentPath = getDocumentPathMemoized(slug);
    let rawMdx = "";
    let lastUpdated: string | null = null;

    if (Settings.gitload) {
      const response = await fetch(contentPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch content from GitHub: ${response.statusText}`);
      }
      rawMdx = await response.text();
      lastUpdated = response.headers.get('Last-Modified') ?? null;
    } else {
      rawMdx = await fs.readFile(contentPath, "utf-8");
      const stats = await fs.stat(contentPath);
      lastUpdated = stats.mtime.toISOString();
    }

    const parsedMdx = await parseMdx<BaseMdxFrontmatter>(rawMdx);
    const tocs = await getTable(slug);

    return {
      frontmatter: parsedMdx.frontmatter,
      content: parsedMdx.content,
      tocs,
      lastUpdated,
    };
  } catch (err) {
    console.error(`Error processing document for slug: ${slug}`, err);
    return null;
  }
}

export async function getTable(slug: string): Promise<Array<{ level: number; text: string; href: string }>> {
  const extractedHeadings: Array<{ level: number; text: string; href: string }> = [];
  let rawMdx = "";

  const normalized = normalizeSlug(slug);
  if (!normalized) return [];
  
  if (Settings.gitload) {
    const contentPath = `${GitHubLink.href}/raw/main/contents/docs/${normalized}/index.mdx`;
    try {
      const response = await fetch(contentPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch content from GitHub: ${response.statusText}`);
      }
      rawMdx = await response.text();
    } catch (error) {
      console.error(`Error fetching content from GitHub for slug: ${slug}`, error);
      return [];
    }
  } else {
    const contentPath = path.join(process.cwd(), "contents/docs", normalized, "index.mdx");
    try {
      const stream = createReadStream(contentPath, { encoding: 'utf-8' });
      for await (const chunk of stream) {
        rawMdx += chunk;
      }
    } catch (error) {
      console.error(`Error reading local file for slug: ${slug}`, error);
      return [];
    }
  }

  let match;
  while ((match = headingsRegex.exec(rawMdx)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    extractedHeadings.push({
      level,
      text,
      href: `#${innerslug(text)}`,
    });
  }

  return extractedHeadings;
}

function innerslug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Initialize path map with normalized paths
const pathIndexMap = new Map(
  PageRoutes.map((route, index) => [
    normalizeSlug(route.href),
    index
  ])
);

export function getPreviousNext(path: string) {
  const normalized = normalizeSlug(path);
  const index = pathIndexMap.get(normalized);

  if (index === undefined || index === -1) {
    return { prev: null, next: null };
  }

  const prev = index > 0 ? PageRoutes[index - 1] : null;
  const next = index < PageRoutes.length - 1 ? PageRoutes[index + 1] : null;

  return { prev, next };
}

const preCopy = () => (tree: any) => {
  visit(tree, "element", (node) => {
    if (node.tagName === "pre") {
      const [codeEl] = node.children;
      if (codeEl?.tagName === "code") {
        node.raw = codeEl.children?.[0]?.value || "";
      }
    }
  });
};

const postCopy = () => (tree: any) => {
  visit(tree, "element", (node) => {
    if (node.tagName === "pre" && node.raw) {
      node.properties["raw"] = node.raw;
    }
  });
};