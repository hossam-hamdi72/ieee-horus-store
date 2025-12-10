
# IEEE Horus Electronic Store — Static E-commerce Template

This project is a static, mobile-friendly e-commerce website template for a small electronics store.
It includes a client-side cart and a Checkout form that submits orders to **Google Sheets** via a Google Apps Script Web App (recommended) — so you can collect orders without a paid backend.

## What is included
- index.html, shop.html, product.html, cart.html, checkout.html, about.html, contact.html, faq.html
- styles.css, script.js
- products.json (sample products)
- assets/ (placeholders for images/logo)
- README with deployment instructions

## How to collect orders (Google Sheets method — recommended)
1. Create a new Google Sheet in your Google Drive.
2. Open **Extensions → Apps Script**.
3. Replace the `Code.gs` content with the script below, and save:

```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById('PUT_YOUR_SHEET_ID_HERE');
    var sheet = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
    var data = JSON.parse(e.postData.contents);
    var row = [
      new Date(),
      data.name || '',
      data.phone || '',
      data.address || '',
      data.payment_method || '',
      JSON.stringify(data.items || []),
      data.notes || ''
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error', message:err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Save, then **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy and copy the Web App URL.
5. In your project `script.js`, replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with the deployed Web App URL.
6. In the Apps Script, replace `'PUT_YOUR_SHEET_ID_HERE'` with your Google Sheet ID (from the URL).
7. Test the checkout by filling the form — orders will append to the Google Sheet.

## Deploy the site for free
- Use **GitHub Pages**: push the folder to a repo and enable Pages on `main` branch.
- Or use **Netlify** / **Vercel**: drag & drop the folder or connect the repo.
Both services have free plans and straightforward deploys.

## Logo & Colors
- Replace `assets/logo-placeholder.png` with your logo.
- Edit CSS variables in `styles.css` to change brand colors.

## Notes
- This template uses client-side storage (localStorage) for the cart.
- If Google Apps Script endpoint is unreachable, the checkout downloads `order.json` as a fallback so you still receive order data.
- For an advanced backend (order emails, admin dashboard), consider a small Node.js server or Firebase.

