<?xml version="1.0" encoding="utf-8"?>
<!--
#####   ##   #    #  ####  #####  # #    # #    #     # #    # #    #
  #    #  #   #  #  #    # #    # # #    # ##  ##     # ##   # #   #
  #   #    #   ##   #    # #    # # #    # # ## #     # # #  # ####
  #   ######   ##   #    # #    # # #    # #    # ### # #  # # #  #
  #   #    #  #  #  #    # #    # # #    # #    # ### # #   ## #   #
  #   #    # #    #  ####  #####  #  ####  #    # ### # #    # #    #
-->

<!--

# Pretty Feed

Styles an RSS/Atom feed, making it friendly for humans viewers, and adds a link
to aboutfeeds.com for new user onboarding. See it in action:

   https://interconnected.org/home/feed


## How to use

1. Download this XML stylesheet from the following URL and host it on your own
   domain (this is a limitation of XSL in browsers):

   https://github.com/genmon/aboutfeeds/blob/main/tools/pretty-feed-v3.xsl

2. Include the XSL at the top of the RSS/Atom feed, like:

```
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="/PATH-TO-YOUR-STYLES/pretty-feed-v3.xsl" type="text/xsl"?>
```

3. Serve the feed with the following HTTP headers:

```
Content-Type: application/xml; charset=utf-8  # not application/rss+xml
x-content-type-options: nosniff
```

(These headers are required to style feeds for users with Safari on iOS/Mac.)



## Limitations

- Styling the feed *prevents* the browser from automatically opening a
  newsreader application. This is a trade off, but it's a benefit to new users
  who won't have a newsreader installed, and they are saved from seeing or
  downloaded obscure XML content. For existing newsreader users, they will know
  to copy-and-paste the feed URL, and they get the benefit of an in-browser feed
  preview.
- Feed styling, for all browsers, is only available to site owners who control
  their own platform. The need to add both XML and HTTP headers makes this a
  limited solution.


## Credits

pretty-feed is based on work by lepture.com:

   https://lepture.com/en/2019/rss-style-with-xsl

This current version is maintained by aboutfeeds.com:

   https://github.com/genmon/aboutfeeds

The original version was designed for RSS; the Atom version is an adaptation based on that:

   https://github.com/nhoizey/nicolas-hoizey.com/blob/main/src/assets/pretty-atom-feed-v3.xsl

For related discussions, see:

   https://github.com/genmon/aboutfeeds/issues/26

## Feedback

This file is in BETA. Please test and contribute to the discussion:

     https://github.com/genmon/aboutfeeds/issues/8

-->
<xsl:stylesheet
    version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="4.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="color-scheme" content="light dark" />
        <title><xsl:value-of select="atom:feed/atom:title"/></title>
        <link rel="stylesheet" href="https://chinese-fonts-cdn.deno.dev/packages/lxgwwenkai/dist/LXGWWenKai-Bold/result.css" />
        <link rel="stylesheet" href="https://chinese-fonts-cdn.deno.dev/packages/lxgwwenkai/dist/LXGWWenKai-Regular/result.css" />
        <link rel="stylesheet" href="/styles/style.css" type="text/css"/>
        <style type="text/css">
          details p {
            white-space: pre-line;
          }
          h1 {
            display: flex;
            align-items: center;
            gap: 0.5em;
          }
          h1 svg {
            width: 1.2em;
            height: 1.2em;
            vertical-align: middle;
            position: relative;
            top: -4px;
          }
          .copyFeedBtn {
            font-size: 16px;
            margin: 0 8px;
            cursor: pointer;
          }
        </style>
        <script src="/js/color-scheme.js"></script>
        <script src="/js/copy-feed-url.js"></script>
      </head>
      <body>
        <div id="preamble" class="status">
          <ul class="ally-nav">
            <li>
              <a id="skip-content" href="#content">Skip to main content</a>
            </li>
            <li>
              <a id="skip-postamble" href="#postamble">Skip to comments</a>
            </li>
          </ul>
          <nav>
            <ul>
              <li><a href="/index.html">主页</a></li>
              <li><a href="/inside-black-hole.html">黑洞里</a></li>
              <li><a href="/rss.xml">订阅</a></li>
              <li><a href="/search.html">搜索</a></li>
            </ul>
            <select onchange="switchMode(this.value)" id="lightdark">
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </nav>
        </div>
        <section>
          <p>
            <mark>这是一个 Atom 订阅流 (Atom feed) 你可以<button type="button" onclick="copyFeedUrl()" class="copyFeedBtn">复制当前 URL</button>进行订阅ლ(´ڡ`ლ)</mark>
          </p>
          <p><mark>如果你对订阅流不了解, 你可以看看 <a href="https://taxodium.ink/about-feeds.html">About Feeds</a>。</mark></p>
        </section>
        <div class="container">
          <header>
            <h1>
               <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 256 256">
                <defs>
                  <linearGradient x1="0.085" y1="0.085" x2="0.915" y2="0.915" id="RSSg">
                    <stop offset="0.0" stop-color="#E3702D"/><stop offset="0.1071" stop-color="#EA7D31"/>
                    <stop offset="0.3503" stop-color="#F69537"/><stop offset="0.5" stop-color="#FB9E3A"/>
                    <stop offset="0.7016" stop-color="#EA7C31"/><stop offset="0.8866" stop-color="#DE642B"/>
                    <stop offset="1.0" stop-color="#D95B29"/>
                  </linearGradient>
                </defs>
                <rect width="256" height="256" rx="55" ry="55" x="0"  y="0"  fill="#CC5D15"/>
                <rect width="246" height="246" rx="50" ry="50" x="5"  y="5"  fill="#F49C52"/>
                <rect width="236" height="236" rx="47" ry="47" x="10" y="10" fill="url(#RSSg)"/>
                <circle cx="68" cy="189" r="24" fill="#FFF"/>
                <path d="M160 213h-34a82 82 0 0 0 -82 -82v-34a116 116 0 0 1 116 116z" fill="#FFF"/>
                <path d="M184 213A140 140 0 0 0 44 73 V 38a175 175 0 0 1 175 175z" fill="#FFF"/>
              </svg>
              <xsl:value-of select="atom:feed/atom:title"/>
            </h1>
            <p><xsl:value-of select="atom:feed/atom:subtitle | atom:feed/atom:description"/></p>
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="atom:feed/atom:link[@rel='alternate']/@href"/>
              </xsl:attribute>
              Visit Website ➙
            </a>
          </header>
          <h2>最近更新</h2>
          <xsl:apply-templates select="atom:feed/atom:entry" />
        </div>
      </body>
    </html>
  </xsl:template>
  <xsl:template match="atom:feed/atom:entry">
    <div class="item">
      <h3>
        <a>
          <xsl:attribute name="href">
            <xsl:value-of select="atom:link/@href"/>
          </xsl:attribute>
          <xsl:value-of select="atom:title"/>
        </a>
      </h3>
      <small class="gray">
        Published: <xsl:value-of select="atom:updated" />
      </small>
      <details style="margin-top: 0.5em;">
        <summary>摘要</summary>
        <p><xsl:value-of select="atom:summary"/></p>
      </details>
    </div>
  </xsl:template>
</xsl:stylesheet>
