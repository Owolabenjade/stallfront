# DEMO: the demo video

Limit: under 3:00 (Official Rules s.4). Public on YouTube, English, no music.
Every claim spoken or shown is in `ops/CLAIMS.md`. The story leads with the seller (D-009).

## The video
- File: `C:\Users\PAB-NETWORK\Videos\Stallfront demo.mp4` (2:38, 1920x1080, captions burned in; `Stallfront demo.srt` beside it). Evidence: E-024.
- Made on 2026-11-11 from the live site: a scripted browser ran the demo path on https://stallfront.onrender.com and PayPal's sandbox, and the narration was generated with ElevenLabs in the builder's cloned voice. Waits (the AI drafting the listings, PayPal page loads) are cut.
- To rebuild it: `ops/private/video-tools/README.md` (private, not in git).

## Script as recorded

| Part | On screen | Narration |
|---|---|---|
| Title | Title card | (none) |
| Problem | Home page, the product photos | "Say you sell a few things through Instagram posts and PayPal links. A buyer messages: is this still available? How much? You reply later with a PayPal link, and they may have moved on." |
| Pitch | Headline and the line under it | "Stallfront turns product photos into a PayPal shop in minutes. AI writes the listings. Shoppers pay with PayPal, or ask their AI assistant to shop for them." |
| Open a shop | /new: sample photos, Write my listings, the review page, a price changed to $149, Publish, "Registered with PayPal" | "Here's how a seller starts. I add four product photos, and the AI writes each listing: title, description, price, and the words shoppers search for." / "It flags what a photo can't show, so I check those, and I set my own price." / "I publish, and every product is registered with PayPal." |
| Buy | Corner Stall: the Buy with PayPal button, the assistant's suggestion, the $271.00 checkout, PayPal login, the review page (Arabic, with a note), the receipt | "This is Corner Stall, a demo shop made the same way from six photos. A shopper can press Buy with PayPal on any product," / "or ask the shop's AI assistant: new job on Monday, get me a leather work bag and a jacket, under two hundred and eighty dollars for both." / "It searches the shop, picks the briefcase and the denim jacket, and gets one PayPal checkout ready. The assistant can't pay." / "I review the order in PayPal and sign in as the test buyer." / "This test account is set up in Dubai, so PayPal shows this page in Arabic. I approve the payment." / "The payment has gone through, and here's the PayPal payment ID." |
| Seller view | Orders with their channels; "What the assistant did" opened | "On the seller's side, every order shows whether it's paid and how it came in: a shopper, the shop's assistant, or an AI app connected from outside, with each step an assistant took." |
| How it works | GitHub README: diagram, Built with PayPal and AI | "Under the hood: PayPal Orders for checkout and capture, PayPal Catalog Products for every listing, Groq models for the photo drafts and the assistant, and WebMCP on the page, with MCP for other AI apps. It runs on Render." |
| Proof | README Proof table | "We tested the assistant ten times on the live site, and it reached the right checkout every time, in under four seconds." |
| Close | Home page, then the end card | "Stallfront: turn product photos into a PayPal shop in minutes. Try it at stallfront dot onrender dot com." |

## Upload to YouTube (the human)
1. Go to https://studio.youtube.com, click **Create**, then **Upload videos**, and pick `Stallfront demo.mp4` from your Videos folder.
2. Title: `Stallfront: turn product photos into a PayPal shop in minutes`
3. Description:
   ```
   Stallfront turns product photos into a PayPal shop in minutes. AI writes the listings. Shoppers pay with PayPal, or ask their AI assistant to shop for them, and only the buyer can approve a payment. Built for the PayPal AI Hackathon.
   Recorded on the live site with PayPal's sandbox (test payments only). The narration voice was generated with ElevenLabs.
   Live demo: https://stallfront.onrender.com
   Code: https://github.com/Owolabenjade/stallfront
   ```
4. Audience: "No, it's not made for kids." If YouTube asks about altered or synthetic content, answer **Yes** (the narration is an AI voice).
5. Visibility: **Public**. Publish.
6. Open the link in a private window (Ctrl + Shift + N) to check it plays without signing in. Send the link to Claude.
