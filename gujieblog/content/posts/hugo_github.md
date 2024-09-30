+++
title = '使用 Hugo 和 GitHub Pages 创建和托管网站'
date = 2024-09-30T19:28:35+08:00
author = 'Gu'
draft = false
disableShare = true
ShowWordCount = false
categories = 'Introduction'
[editPost]
URL = "https://medium.com/@magstherdev/github-pages-hugo-86ae6bcbadd"  # 编辑文章的链接，通常指向 GitHub 仓库
Text = "medium原文"  # 编辑链接的文本，如“建议更改”
appendFilePath = true  # 是否将文件路径追加到编辑链接末尾，用于精确定位文件
+++
## 介绍
Hugo是由Go编写的快速现代静态网站生成器，旨在让网站创建变得有趣。Hugo是一个通用的网站框架。从技术角度来说，Hugo是一个[静态网站生成器](https://hugo.opendocs.io/about/benifits/)。与每个访问者请求动态构建页面的系统不同，Hugo在创建或更新内容时构建页面。由于网站被查看的频率远远多于编辑的频率，Hugo旨在为您的网站最终用户提供最佳的查看体验，并为网站作者提供理想的编写体验。

![CleanShot 2024-09-30 at 19.51.56@2x.png](https://raw.githubusercontent.com/Guuu16/photos/main/CleanShot%202024-09-30%20at%2019.51.56%402x.png)


## 先决条件
在深入研究之前，请确保你具备以下内容:

- 一个GitHub账号
- hugo安装在你的系统上
- 基本熟悉Git和GitHub Pages


## 设置GitHub页面

[* * GitHub Pages_ * *](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) 是一个静态网站托管服务，它直接从GitHub上的存储库中获取HTML, CSS和JavaScript文件，可选地通过构建过程运行这些文件，并发布网站。* 

除此之外，它也是免费的。

按照以下步骤开始:

1. 创建一个 named `<username>.github.io` （你github的username） 的 repository 去发布你的网站
2. 将存储库克隆到本地计算机。
3. 添加一个`index.html`文件到你的仓库中。
4. Commit and push your changes.
5. Enable GitHub Pages in your repository settings.
6. Within a few moments, your website will be live at `https://<username>.github.io`.

 *注意:请参阅GitHub的文档了解任何限制，你可以在[这里](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#usage-limits)找到。


## 使用hugo

在`blogname`目录中为项目创建[目录结构](https://gohugo.io/getting-started/directory-structure/)。

```text
hugo new site blogname
```

将当前目录更改为项目的根目录。

```text
cd blogname
```

在当前目录中初始化一个空的Git仓库。（或者是直接在github上创建好clone）

```text
git init
```

clone你喜欢的主题（比如[PaperMod](https://github.com/adityatelange/hugo-PaperMod/wiki/Installation)）(papermod的具体用法点击链接)

```text
git submodule add https://github.com/adityatelange/hugo-PaperMod.git blogname/themes/PaperMod
```

在站点配置文件config.yaml中追加一行，指出当前主题，没有的话把hugo.toml删了创建一个

```text
echo "theme: "PaperMod"" >> config.yaml
```

增加baseurl进去 
```shell
baseURL: "http://magsther.github.io/"
```


官方给的config.yaml模版
``` text

baseURL: "https://examplesite.com/"
title: ExampleSite
paginate: 5
theme: PaperMod

enableRobotsTXT: true
buildDrafts: false
buildFuture: false
buildExpired: false

minify:
  disableXML: true
  minifyOutput: true

params:
  env: production # to enable google analytics, opengraph, twitter-cards and schema.
  title: ExampleSite
  description: "ExampleSite description"
  keywords: [Blog, Portfolio, PaperMod]
  author: Me
  # author: ["Me", "You"] # multiple authors
  images: ["<link or path of image for opengraph, twitter-cards>"]
  DateFormat: "January 2, 2006"
  defaultTheme: auto # dark, light
  disableThemeToggle: false

  ShowReadingTime: true
  ShowShareButtons: true
  ShowPostNavLinks: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: false
  ShowWordCount: true
  ShowRssButtonInSectionTermList: true
  UseHugoToc: true
  disableSpecial1stPost: false
  disableScrollToTop: false
  comments: false
  hidemeta: false
  hideSummary: false
  showtoc: false
  tocopen: false

  assets:
    # disableHLJS: true # to disable highlight.js
    # disableFingerprinting: true
    favicon: "<link / abs url>"
    favicon16x16: "<link / abs url>"
    favicon32x32: "<link / abs url>"
    apple_touch_icon: "<link / abs url>"
    safari_pinned_tab: "<link / abs url>"

  label:
    text: "Home"
    icon: /apple-touch-icon.png
    iconHeight: 35

  # profile-mode
  profileMode:
    enabled: false # needs to be explicitly set
    title: ExampleSite
    subtitle: "This is subtitle"
    imageUrl: "<img location>"
    imageWidth: 120
    imageHeight: 120
    imageTitle: my image
    buttons:
      - name: Posts
        url: posts
      - name: Tags
        url: tags

  # home-info mode
  homeInfoParams:
    Title: "Hi there \U0001F44B"
    Content: Welcome to my blog

  socialIcons:
    - name: x
      url: "https://x.com/"
    - name: stackoverflow
      url: "https://stackoverflow.com"
    - name: github
      url: "https://github.com/"

  analytics:
    google:
      SiteVerificationTag: "XYZabc"
    bing:
      SiteVerificationTag: "XYZabc"
    yandex:
      SiteVerificationTag: "XYZabc"

  cover:
    hidden: true # hide everywhere but not in structured data
    hiddenInList: true # hide on list pages and home
    hiddenInSingle: true # hide on single page

  editPost:
    URL: "https://github.com/<path_to_repo>/content"
    Text: "Suggest Changes" # edit text
    appendFilePath: true # to append file path to Edit link

  # for search
  # https://fusejs.io/api/options.html
  fuseOpts:
    isCaseSensitive: false
    shouldSort: true
    location: 0
    distance: 1000
    threshold: 0.4
    minMatchCharLength: 0
    limit: 10 # refer: https://www.fusejs.io/api/methods.html#search
    keys: ["title", "permalink", "summary", "content"]
menu:
  main:
    - identifier: categories
      name: categories
      url: /categories/
      weight: 10
    - identifier: tags
      name: tags
      url: /tags/
      weight: 20
    - identifier: example
      name: example.org
      url: https://example.org
      weight: 30
# Read: https://github.com/adityatelange/hugo-PaperMod/wiki/FAQs#using-hugos-syntax-highlighter-chroma
pygmentsUseClasses: true
markup:
  highlight:
    noClasses: false
    # anchorLineNos: true
    # codeFences: true
    # guessSyntax: true
    # lineNos: true
    # style: monokai

```



## Run Hugo
要在本地查看网站，可以使用Hugo的开发服务器。只需在提示符中输入hugo server，它就会开始构建网站。在输出的底部，我们可以找到如何访问该网站的链接。—D 为草稿模式
打开浏览器，点击 [**http://localhost:1313**](http://localhost:1313/)


## 添加hugo中内容
通过添加帖子或页面为你的网站创建新内容。使用提供的模板和命令来简化流程。例如，我首先添加了`page.md` [file](https://github.com/adityatelange/hugo-PaperMod/wiki/Installation#sample-pagemd)。
```text

---
title: "My 1st post"
date: 2020-09-15T11:30:03+00:00
# weight: 1
# aliases: ["/first"]
tags: ["first"]
author: "Me"
# author: ["Me", "You"] # multiple authors
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
description: "Desc Text."
canonicalURL: "https://canonical.url/to/page"
disableHLJS: true # to disable highlightjs
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: true
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "<image path/url>" # image path/url
    alt: "<alt text>" # alt text
    caption: "<text>" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
editPost:
    URL: "https://github.com/<path_to_repo>/content"
    Text: "Suggest Changes" # edit text
    appendFilePath: true # to append file path to Edit link
---
```


Md文件是在存储库中提供的archtypes文件夹。你可以将该文件视为所有未来文章的模板。为了创建一篇新文章，输入hugo new 文件夹名/example.md

这增加了一个示例。Md文件在内容文件夹。

现在可以用编辑器打开这个文件，创建博客文章。

如果Hugo进程仍在运行，并且您使用-D标志，那么您将看到一个新的博客文章现在添加到您的网站。

一旦你完成了对文章的修改，你可以将`draft: true`改为`draft: false`来部署它。这取决于你使用的主题。如果您使用默认主题，那么Hugo在构建站点时不会发布草稿内容

## 将您的博客发布到GitHub Pages

使用Hugo生成博客并将更改推送到GitHub。在你的仓库设置中启用GitHub Pages，使你的博客可以在线访问。

为此，我们需要运行`hugo`来生成博客。

```shell
hugo -d docs 
```

注意路径，应该是生成在项目根目录中, 所以我是 hugo -d ../docs 
来保证docs在根目录下

之后，我们添加、提交并推送它们到GitHub仓库。

接下来，我们需要启用GitHub Pages，可以访问我们的GitHub仓库，并从那里单击Pages。通过将源从None更改为从分支部署来启用它

![CleanShot 2024-09-30 at 20.22.18@2x.png](https://raw.githubusercontent.com/Guuu16/photos/main/CleanShot%202024-09-30%20at%2020.22.18%402x.png)

## GitHub Actions

每当对仓库进行更改时，GitHub Actions都会自动重建和部署网站的过程。

![CleanShot 2024-09-30 at 20.23.28@2x.png](https://raw.githubusercontent.com/Guuu16/photos/main/CleanShot%202024-09-30%20at%2020.23.28%402x.png)


后续可以看[官方文档](https://gohugo.io/getting-started/quick-start/)进行添加修改网站内容。