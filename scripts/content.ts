import path from "path";
import { promises as fs } from "fs";
import grayMatter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import { Documents } from '@/settings/documents';
import { Paths } from "@/lib/pageroutes";

// Types
type DocumentNode = Extract<Paths, { href: string; title: string }>;
type ProcessedDocument = {
  slug: string;
  title: string;
  description: string;
  content: string;
};

// Constants
const docsDir = path.join(process.cwd(), "contents/docs");
const outputDir = path.join(process.cwd(), "public", "search-data");
const CUSTOM_COMPONENTS = [
  "Tabs",
  "TabsList",
  "TabsTrigger",
  "pre",
  "Mermaid",
] as const;

// Type guard
function isRoute(node: Paths): node is DocumentNode {
  return "href" in node && "title" in node;
}

// Path handling
function createSlug(filePath: string): string {
  const relativePath = path.relative(docsDir, filePath);
  const parsed = path.parse(relativePath);
  const slugPath = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name;
  const normalizedSlug = slugPath.replace(/\\/g, '/');

  return parsed.name === "index"
    ? `/${parsed.dir.replace(/\\/g, '/')}` || "/"
    : `/${normalizedSlug}`;
}

// Document search
function findDocumentBySlug(slug: string): DocumentNode | null {
  function searchDocs(
    docs: ReadonlyArray<Paths>, 
    currentPath = ""
  ): DocumentNode | null {
    for (const doc of docs) {
      if (isRoute(doc)) {
        const fullPath = currentPath + doc.href;
        if (fullPath === slug) return doc;
        if (doc.items) {
          const found = searchDocs(doc.items, fullPath);
          if (found) return found;
        }
      }
    }
    return null;
  }
  
  return searchDocs(Documents);
}

// Directory handling
async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch (err) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// MDX processing
function removeCustomComponents() {
  return (tree: any) => {
    visit(tree, "mdxJsxFlowElement", (node, index, parent) => {
      if (CUSTOM_COMPONENTS.includes(node.name)) {
        parent.children.splice(index, 1);
      }
    });
  };
}

async function processMdxFile(filePath: string): Promise<ProcessedDocument> {
  try {
    const rawMdx = await fs.readFile(filePath, "utf-8");
    const { content, data: frontmatter } = grayMatter(rawMdx);

    const processor = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(removeCustomComponents)
      .use(remarkStringify);

    const plainContent = await processor.process(content);
    const slug = createSlug(filePath);
    const matchedDoc = findDocumentBySlug(slug);

    return {
      slug,
      title: frontmatter.title || (matchedDoc?.title ?? "Untitled"),
      description: frontmatter.description || "",
      content: String(plainContent.value),
    };
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    throw err;
  }
}

// File discovery
async function getMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const subFiles = await getMdxFiles(fullPath);
        files.push(...subFiles);
      } else if (item.name.endsWith(".mdx")) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    throw err;
  }

  return files;
}

// Main conversion function
async function convertMdxToJson(): Promise<void> {
  try {
    await ensureDirectoryExists(outputDir);
    const mdxFiles = await getMdxFiles(docsDir);
    const combinedData: ProcessedDocument[] = [];

    for (const file of mdxFiles) {
      try {
        const jsonData = await processMdxFile(file);
        combinedData.push(jsonData);
      } catch (err) {
        console.error(`Skipping file ${file} due to error:`, err);
        continue;
      }
    }

    const combinedOutputPath = path.join(outputDir, "documents.json");
    await fs.writeFile(
      combinedOutputPath, 
      JSON.stringify(combinedData, null, 2)
    );

    console.log(`Successfully processed ${combinedData.length} files`);
  } catch (err) {
    console.error("Error in conversion process:", err);
    process.exit(1);
  }
}

// Run the conversion
convertMdxToJson();