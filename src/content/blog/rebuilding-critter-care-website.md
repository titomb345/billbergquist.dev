---
title: "How I Rebuilt Critter Care's Website from Scratch"
description: "A case study of rebuilding a pet sitting website from a dated IONOS template to a fast, modern Astro site. Before/after screenshots and technical details."
publishDate: 2026-02-20
updatedDate: 2026-03-09
tags: ["web design", "case study", "astro", "small business"]
ogImage: "/og/blog/rebuilding-critter-care-website.png"
featured: true
---

<script src="/blog/critter-care-rebuild/before-after.js" defer></script>

Just a few days ago, I launched a new website for my friend's pet sitting business. I wanted to write about how it came together while it's still fresh.

My friend Laurie has run [Critter Care](https://critter-care.com), a pet sitting and dog walking business in the South Bay area of Los Angeles, since 1999. I used to live in Lawndale and she was a good friend and neighbor. Our dogs played together all the time. At some point I became her unofficial webmaster, and for the last five or six years she'd send me a little money here and there to make edits on her IONOS site. The editor was a truly outdated drag-and-drop thing, and every time I logged in I thought about how much better the site could be if I just rebuilt it from scratch.

She was paying IONOS about $18 a month for hosting and their site builder. On top of that, somewhere along the way IONOS had talked her into an SEO package for an extra $35 a month. She'd been paying that for who knows how long, and as far as I could tell, it wasn't doing anything. No structured data on the site, no meta descriptions, no evidence of any optimization work at all. Fifty-three dollars a month, total, for a site that hadn't been meaningfully updated in years.

I'd always had big ideas of rebuilding it for her, and this past Super Bowl weekend, I finally did it.

## The Old Site

The thing is, Laurie had a website at all, and that already puts her ahead of a lot of small business owners. She'd set it up herself using IONOS's builder, and it had real content: photos of her with the animals, descriptions of every service she offers, testimonials from actual clients. All the right stuff was there. She'd been running a business for 25 years at that point. She knew what her customers needed to see.

The site had a dark theme with a header photo of dogs playing in the yard. The homepage doubled as a services page with a cartoon caricature banner that somebody had drawn for her years ago.

<before-after
  before="/blog/critter-care-rebuild/old-home.webp"
  after="/blog/critter-care-rebuild/new-home.webp"
  alt="Critter Care homepage before and after redesign">
</before-after>

The about page had everything you'd want to know about Laurie and the business: her background, her qualifications, photos of her with the animals. It just needed better structure and a layout that didn't fight you when you tried to read it.

<before-after
  before="/blog/critter-care-rebuild/old-about.webp"
  after="/blog/critter-care-rebuild/new-about.webp"
  alt="Critter Care about page before and after redesign">
</before-after>

The hire-us page is my favorite comparison. The old version had a downloadable Word document for the service contract. A .doc file that you were supposed to print and sign for an introductory meeting. The new version walks people through the process step by step, with the service contract available as a PDF right on the page.

<before-after
  before="/blog/critter-care-rebuild/old-hire-us.webp"
  after="/blog/critter-care-rebuild/new-hire-us.webp"
  alt="Critter Care hire us page before and after redesign">
</before-after>

I pulled the old screenshots from the [Wayback Machine](https://web.archive.org/web/20240526153123/http://www.critter-care.com/) before the site went away. Useful for showing the contrast.

## The Weekend Build

Saturday morning I started by going through every page of the old site in detail. I pulled out all the content, the photos, the service descriptions, the pricing, the testimonials. Then I started building modern equivalents in [Astro](https://astro.build/), starting at mobile and working up. Each page got restructured around what visitors actually need to find: what services are available, what they cost, how to get in touch.

Laurie's services and prices were all on the old site, but buried in paragraph text. I pulled them out into individual cards with the price, duration, and a short description for each service. You can scan the page in five seconds and know exactly what everything costs.

<figure style="margin: 2rem 0;">
  <img src="/blog/critter-care-rebuild/new-services.webp" alt="Critter Care services page with pricing cards" loading="lazy" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); width: 100%;" />
</figure>

Then I went through every page and optimized the SEO. This is the part that still bothers me about her old setup. She was paying $35 a month for an SEO package that did nothing. The new site has [Schema.org](https://schema.org/) markup for the business type, service area, and services offered. Proper meta tags on every page. An XML sitemap. All baked in from day one, because that's just how you build a website in 2026. It shouldn't cost extra.

Sunday I spent a few hours during the game itself polishing everything I could. Making sure the site looked great and performed well. Mobile was the big focus. The old site was built for desktop browsers. On a phone you had to pinch and zoom to read anything. [Over 60% of web traffic](https://www.statista.com/statistics/277125/share-of-website-traffic-coming-from-mobile-devices/) comes from mobile devices now, and for a local service business like pet sitting, it's probably even higher. People search for pet sitters on their phones. Here's what that difference looks like:

<before-after
  before="/blog/critter-care-rebuild/old-mobile.webp"
  after="/blog/critter-care-rebuild/new-mobile.webp"
  alt="Critter Care mobile experience before and after redesign">
</before-after>

Laurie had tons of great photos of herself with the dogs and cats she takes care of. I used those throughout the site instead of stock images. A real photo of Laurie holding someone's dog builds way more trust than a stock photo of a smiling person in scrubs. People want to see who's actually going to be in their house with their pets.

I also set up [Decap CMS](https://decapcms.org/) so Laurie can update her own content without calling me every time she wants to change a price or add a testimonial. She logs in, edits text, uploads photos, and publishes. She doesn't need to know what happens behind the scenes. She just clicks "Publish."

About an hour after the game ended, I sent Laurie an email with a Netlify deploy link showing her what the new site could look like. Hosted for free, with her only cost being the $20/year domain renewal on Squarespace (which was actually $5 for the first year with a promo). She was thrilled. The new site went live about a week later after IONOS transferred the domain over.

## The Technical Stack

For anyone who wants to know what's under the hood:

- **[Astro](https://astro.build/)** for static site generation. HTML is generated at build time, so there's nothing to compute on each visit.
- **Vanilla CSS** with custom properties for theming. No CSS framework, no utility classes, just clean stylesheets.
- **[Netlify](https://www.netlify.com/)** for hosting and form processing. Free tier handles everything a site this size needs.
- **Zero JavaScript frameworks** on the client side. No React, no Vue, nothing. The browser gets HTML and CSS. That's it.
- **WebP images** resized and optimized for the web. No 4000px photos loading on a 400px phone screen.
- **Semantic HTML** with proper heading hierarchy, landmark elements, and alt text on every image.

The site loads in under a second. Not a benchmark number from a lab. Real-world, on a regular connection, the page is fully rendered before you can blink. Astro makes this almost automatic because there's no JavaScript to download, parse, and execute before the page can render. The HTML arrives and the browser just... shows it.

## The Money Part

The rebuild itself was free because Laurie is a friend and I wanted the portfolio piece. If I were pricing this as a client project, a site like Critter Care would run somewhere in the $1,500-$2,500 range. It's a straightforward business site with a handful of pages, no e-commerce, no complex integrations. I break down [what affects pricing here](/blog/how-much-does-a-website-cost-denver/).

But look at what Laurie was paying before:

- IONOS hosting: **$18/month**
- IONOS SEO package: **$35/month**
- Total: **$53/month, or $636/year**

The new site's hosting on Netlify's free tier: **$0/month.** The SEO is built into the site itself. Over three years, that's $1,908 she would have spent on a setup that wasn't helping her. Even at the high end of what I'd charge for this kind of site, the rebuild pays for itself in under four years just from the monthly savings. And that's before you factor in the value of actually having a site that works on phones and shows up in search results.

## The Result

The new Critter Care site:

- Loads in under 1 second (the old site took 4+ seconds)
- Works perfectly on phones
- Has structured pricing that visitors can scan in seconds
- Includes proper SEO with structured data and meta tags
- Costs $0/month to host (down from $53/month)
- Has a CMS so Laurie can update it herself

If you want to see it live, check out [critter-care.com](https://critter-care.com).

When I showed Laurie the new site, her reaction said it all:

> "That's fabulous! I love it! I really appreciate you and the time you're spending on this and saving me money. Please move forward with it ASAP!"
>
> -- Laurie, Critter Care owner

## Sound Familiar?

Laurie's situation isn't unusual. A lot of small business owners are paying $40-75 a month for a website builder and maybe an SEO package on top of that, and the site hasn't been updated in years. It technically exists, but it's not doing anything for them. Worse, they might be paying for services that aren't delivering any value at all.

If that sounds like you, it's probably worth a conversation. I build websites for small businesses in Denver, Lakewood, and the Colorado Front Range. I'll look at your current site for free and tell you honestly what it would take to fix. If you're not sure whether your site needs work, I wrote about [the signs that it's time for a redesign](/blog/signs-your-business-website-needs-redesign/).

[Let's talk about your project &rarr;](/services/)

I serve businesses in [Denver](/services/denver/), [Lakewood](/services/lakewood/), [Boulder](/services/boulder/), [Arvada](/services/arvada/), [Golden](/services/golden/), [Littleton](/services/littleton/), [Aurora](/services/aurora/), [Westminster](/services/westminster/), and [Highlands Ranch](/services/highlands-ranch/).
