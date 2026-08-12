# Extension Icons

Place your extension icons here:

- `icon16.png` (16x16 pixels) - Shown in extension toolbar
- `icon48.png` (48x48 pixels) - Shown in extension management page
- `icon128.png` (128x128 pixels) - Shown in Chrome Web Store

## Quick Icon Generation

### Option 1: Online Tools
- **Favicon Generator**: https://www.favicon-generator.org/
- **Icon Editor**: https://redketchup.io/icon-editor
- **Canva**: Create 128x128 design, then resize

### Option 2: Use Emoji as Icon

For quick testing, you can use an emoji. Create a simple HTML file and screenshot it:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 128px;
      height: 128px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-size: 80px;
    }
  </style>
</head>
<body>🔄</body>
</html>
```

Save as HTML, open in browser, screenshot at 128x128, then resize to create the smaller versions.

### Option 3: Use a Logo Generator
- **LogoMakr**: https://logomakr.com/
- **Hatchful**: https://www.shopify.com/tools/logo-maker

## Design Suggestions

- Use school/sync related imagery (books, calendars, sync arrows)
- Keep it simple and recognizable at small sizes
- Use your platform's brand colors
- Make sure it looks good on both light and dark toolbars

## Temporary Placeholder

For development, you can even use a solid color square. The extension will work without perfect icons.
