import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://billbergquist.dev';
const SITE_NAME = 'Bill Bergquist';

function setMetaTag(property: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attr}="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setRobotsMeta(noindex: boolean) {
  let element = document.querySelector('meta[name="robots"]');
  if (noindex) {
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', 'robots');
      document.head.appendChild(element);
    }
    element.setAttribute('content', 'noindex, nofollow');
  } else if (element) {
    element.remove();
  }
}

const OG_IMAGE = `${BASE_URL}/og-image.png`;

export default function usePageMeta({ title, description, canonical, noindex = false }: PageMeta) {
  useEffect(() => {
    document.title = title;
    setMetaTag('description', description);

    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', SITE_NAME, true);
    setMetaTag('og:image', OG_IMAGE, true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', OG_IMAGE);

    const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    setMetaTag('og:url', url, true);
    setCanonical(url);
    setRobotsMeta(noindex);
  }, [title, description, canonical, noindex]);
}
