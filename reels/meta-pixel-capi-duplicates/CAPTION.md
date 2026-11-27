# Meta Pixel + CAPI duplicates captions: Meta says 20 sales, your store says 10

## Instagram Reel
Meta says 20 sales. Your store says 10. 🧾🧾 Your setup might be counting every sale twice.

Picture two cashiers ringing up the same customer. Your Meta Pixel and your Conversions API can do the same, and then Meta learns from sales that never happened.

How to check:
1️⃣ Open Events Manager and click your Purchase event. See if it comes from the browser, the server, or both
2️⃣ If it's both, check deduplication: both need to send the same event name and event ID so Meta counts the sale once
3️⃣ Compare a week of purchases in Meta with your real orders. If Meta is way higher, ask your developer or your store's app to fix the event ID

Note: not every gap is a duplicate. Meta also counts view-through and different attribution windows. But a big, steady gap is worth checking.

📩 Send this to someone who trusts their Meta numbers a little too much

#metaads #facebookads #conversionsapi #ecommercetips

---

## TikTok
Meta says 20 sales, your store says 10? 🧾🧾
Your Pixel and Conversions API might both be counting the same sale.
1️⃣ Events Manager → Purchase → browser, server or both?
2️⃣ Both? They need the same event ID to deduplicate
3️⃣ Compare a week of Meta purchases with real orders

Send this to someone who trusts their Meta numbers 📩

#metaads #facebookads #ecommerce #shopify

---

## YouTube Shorts
**Title** (58 chars)
Meta Says 20 Sales, Your Store Says 10? Check for Duplicates

**Description**
If your Meta Pixel and Conversions API both send a purchase, Meta only counts it once when both send the same event name and event ID (deduplication). If they don't, the same sale can be counted twice, and Meta optimizes on sales that never happened.

1️⃣ Events Manager → click your Purchase event → see if it comes from the browser, the server, or both.
2️⃣ If both, check deduplication: same event name + same event ID (for purchases, the order ID works well).
3️⃣ Compare a week of Meta purchases with your real orders. Way higher? Ask your developer or your store's app to fix the event ID.

Note: attribution windows and view-through also cause gaps, so not every difference is a duplicate.
Source: Meta for Developers, "Handling Duplicate Pixel and Conversions API Events".

Follow @tech_blogcorner for simple Google and Meta ads fixes.

#metaads #facebookads #shorts
