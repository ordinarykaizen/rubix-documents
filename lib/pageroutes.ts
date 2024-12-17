// pageroutes.ts
import { Documents } from '@/settings/documents';

export type Paths = 
  | {
      title: string;
      href: string;
      noLink?: true;
      heading?: string;
      items?: ReadonlyArray<Paths>;  // Changed from Paths[] to ReadonlyArray<Paths>
    }
  | {
      spacer: true;
    };

// This helper ensures type compatibility
const convertToMutablePaths = (docs: ReadonlyArray<any>): Paths[] => {
  return docs as unknown as Paths[];
};

export const Routes: Paths[] = convertToMutablePaths([...Documents]);

type Page = { title: string; href: string };

function isRoute(node: Paths): node is Extract<Paths, { title: string; href: string }> {
  return "title" in node && "href" in node;
}

function getAllLinks(node: Paths, parentPath: string = ''): Page[] {
  const pages: Page[] = [];

  if (isRoute(node) && !node.noLink) {
    const normalizedHref = node.href.startsWith('/') ? node.href : `/${node.href}`;
    const fullPath = parentPath ? `${parentPath}${normalizedHref}` : normalizedHref;
    pages.push({ title: node.title, href: fullPath });
  }

  if (isRoute(node) && node.items) {
    const currentPath = node.href.startsWith('/') ? node.href : `/${node.href}`;
    node.items.forEach((subNode) => {
      if (isRoute(subNode)) {
        pages.push(...getAllLinks(subNode, currentPath));
      }
    });
  }

  return pages;
}

function removeDuplicateRoutes(routes: Page[]): Page[] {
  const seen = new Set<string>();
  return routes.filter(route => {
    const normalized = route.href.toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

export const PageRoutes = removeDuplicateRoutes(
  Routes.map((it) => getAllLinks(it)).flat()
);