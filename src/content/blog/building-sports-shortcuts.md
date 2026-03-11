---
title: "Building a Sports Alert Tool That Gets Used Every Game Day"
description: "A friend needed a faster way to post player status alerts on social media during live games. I built Sports Shortcuts in a weekend."
publishDate: 2026-03-14
draft: true
tags: ["case study", "react", "web design"]
ogImage: "/og/blog/building-sports-shortcuts.png"
---

A friend of mine works at [Underdog Fantasy](https://underdogfantasy.com), a fantasy sports platform. Part of the job involves posting player injury and status updates to social media during live NFL and NBA games. Every time a player goes down or gets ruled out, he needs to get that information posted fast. Speed matters because followers are watching the game in real time and they want to know what happened before the broadcast catches up.

The problem was the process. He was typing these updates out manually every time. Same format, same structure, just different names, injuries, and days. During a busy NFL Sunday with multiple games running simultaneously, he might need to post 20 or 30 of these in a few hours. Typing "Status alert: Patrick Mahomes (ankle) questionable to return Sunday" from scratch every time is slow and error-prone when you're juggling six games at once.

He asked me if I could build something to speed it up.

## What I Built

[Sports Shortcuts](https://sportsshortcuts.com) is a simple web app that generates formatted status alert messages. You type a player's name, select an injury, pick the day, and it instantly generates every variation of the alert you might need. One click copies the message to your clipboard. Paste it into your social media platform and you're done.

The whole interaction takes about five seconds, maybe less. Type a name, click a message, paste it. During a live game, those saved seconds add up fast.

It supports both NFL and NBA, with different message templates for each sport. NFL has 10 variations, NBA has 21 (NBA has more scenarios like ejections and players heading to the locker room). The app auto-detects the day of the week so you don't have to think about it.

## How It Works

The core of the app is a form with smart autocomplete. I loaded in full NFL and NBA rosters, so when you start typing a player's name, it suggests matches using fuzzy search. Type "Mah" and Patrick Mahomes pops up. Select the player and the app auto-fills their team information. For NBA, it also populates the team mascot since some alert templates use it.

Once the player info is filled in, the app renders every message template at once. Each one is a clickable card. Tap it, and the formatted text is copied to your clipboard. The card flashes green with a checkmark so you know it worked. The whole thing runs client-side with no server calls, so it's instant.

I also built it as a Progressive Web App (PWA), so it can be installed on a phone's home screen and launches instantly. The app caches all the roster data and templates locally after the first load, so it never needs to fetch anything at runtime. No loading spinners, no waiting on API calls. You open it and it's ready.

The roster data was the part that actually tripped me up. My first approach was the [BallDontLie API](https://www.balldontlie.io/), which has a free tier with player data. The problem? The free tier returns every player in history. Not just active rosters. Every player who has ever played in the NBA or NFL. That's roughly 15,000 names. The autocomplete was unusable. You'd type "James" and get 200 results going back to the 1950s.

So I started building a filter. The plan was to pull the full list from BallDontLie, then scrape ESPN's roster pages to cross-reference which players were currently active. I got the ESPN scraper working and was about to wire up the cross-referencing logic when I realized the scraper already had everything I needed. Active players, team names, positions. The API was redundant. I ditched BallDontLie entirely and just scraped ESPN. Fewer dependencies, cleaner data, and the autocomplete went from 15,000 names to around 1,700 active players. The fuzzy search handles variations in how names are typed, so you don't have to remember if it's "Patrick Mahomes" or "Patrick Mahomes II." It normalizes everything and finds the match.

## The Tech

I kept the stack simple since this needed to be built fast and stay reliable:

- **React with TypeScript** for the UI
- **Tailwind CSS** for styling and sport-specific theming (NFL gets their blue and red, NBA gets their blue and orange)
- **Fuse.js** for fuzzy player name search across 1,000+ players
- **Vite** for fast builds and hot reload during development
- **Workbox** for the service worker and offline support
- Hosted on **Netlify** with zero monthly cost

## One Weekend

The whole thing took a weekend to build. Friday evening I set up the project and got the basic form working. Saturday I built out the message templates, added the roster data and autocomplete, and wired up the copy-to-clipboard interaction. Sunday I added the PWA support, dark mode, and deployed it.

That's the advantage of a focused tool. The scope was narrow enough that I could build it properly without cutting corners. No authentication, no database, no admin panel. Just a form that generates text. The simplest version of the thing that solves the problem.

The message templates themselves are just string interpolation. Nothing fancy. But getting the exact wording right for each variation took some back and forth. My friend would send me the format they use, I'd build the template, and he'd test it during a game and let me know if anything needed adjusting. Most of the templates landed on the first try because the format was already standardized in his head. He just needed a tool to output it faster.

## It Actually Gets Used

This is the part that matters. The tool isn't sitting in a repo collecting dust. It gets used during live games, every week during NFL season and throughout the NBA season. Since launch, it's generated hundreds of status alerts across Underdog's social accounts. Here are a few recent ones:

- ["Status alert: Kyren Williams (ankle) questionable to return Sunday."](https://x.com/UnderdogNFL/status/1995214724565463359)
- ["Status alert: Puka Nacua (ankle) headed to locker room Sunday."](https://x.com/UnderdogNFL/status/1977432033560342858)
- ["Status alert: Luka Doncic (eye) headed to locker room Tuesday."](https://x.com/UnderdogNBA/status/2026510145073680887)
- ["Status alert: Jalen Brunson (leg) headed to locker room Wednesday."](https://x.com/UnderdogNBA/status/2029370518961279115)

If you've ever seen one of these and wondered why they all follow the same format, now you know. There's a tool generating them.

The consistency is the feature. Every alert follows the same structure, which means followers learn to recognize the format. When they see "Status alert:" they know exactly what kind of information is coming. That consistency would be hard to maintain if people were typing these out by hand across a team of social media managers. The tool enforces it automatically.

## What I'd Do Differently

If I were building it again, I'd probably use Astro instead of a pure React SPA. The app doesn't need client-side routing or a virtual DOM for what amounts to a form and some text cards. Astro with a React island for the form would cut the JavaScript bundle significantly and load even faster. But honestly, for a weekend project that works well and has been reliable for over a year, I'm not going to rewrite it for marginal gains.

I'd also consider adding more sports. The template system is generic enough that adding NHL or MLB would just mean new roster data and new message templates. The architecture supports it, I just haven't had the request. If anyone from an NHL or MLB account is reading this and wants the same tool for their sport, you know where to find me.

## Why This Project Matters

Sports Shortcuts isn't a flashy portfolio piece. There's no design system or blog or marketing site behind it. No login, no account, no email required. It's a form that makes text. But it solves a real problem for real people who use it in a high-pressure, time-sensitive environment. That's what good software does.

It also costs almost nothing to run. No server, no database, no monthly fees. It sits on Netlify's free tier and serves static files. The only ongoing cost is about $15/year for the domain. That's the kind of efficiency I try to bring to every project. Build it right, host it cheap, and let it do its job.

When someone asks me what kind of work I do, this is the project I talk about. Not because it's technically impressive, but because it shows the process. Someone had a problem, they told me about it, I built a solution over a weekend, and they're still using it. That's the whole job.

If you've got a workflow that involves doing the same thing over and over, it's probably worth automating. Sometimes the most useful tool is the simplest one. [Get in touch](/services/) if you've got something like that and want to talk about building it. You can also read about [another project I built for a friend](/blog/rebuilding-critter-care-website/) or check out [what goes into the cost of a website](/blog/how-much-does-a-website-cost-denver/).

I serve businesses in [Denver](/services/denver/), [Lakewood](/services/lakewood/), [Boulder](/services/boulder/), [Arvada](/services/arvada/), [Golden](/services/golden/), [Littleton](/services/littleton/), [Aurora](/services/aurora/), [Westminster](/services/westminster/), and [Highlands Ranch](/services/highlands-ranch/).
