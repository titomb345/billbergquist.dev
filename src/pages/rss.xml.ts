import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime(),
  );

  return rss({
    title: 'Bill Bergquist — Blog',
    description:
      'Web development, local SEO, and small business website tips from a staff software engineer in Denver, CO.',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
