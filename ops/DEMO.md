# DEMO: video script, shot list, recording steps

Limit: under 3:00 (Official Rules s.4). Target: 2:45 to 2:50. Public on YouTube, English, no music you don't own.
Every claim spoken here is in `ops/CLAIMS.md`.

## Before recording (Claude does this, on request)
1. No more deploys until the video is done (each deploy wipes orders on Render).
2. Redeploy once so the live seller view is clean, then warm the site.
3. Create one paid MCP order on the live demo shop so the seller view shows both kinds of assistant (`scripts/mcp-check.mjs --checkout` + `scripts/approve-sandbox.mjs`).

## Before recording (you do this)
1. Use Chrome or Edge. Close every other tab and window.
2. Hide the bookmarks bar: press **Ctrl + Shift + B**.
3. Turn on Do not disturb: click the bell (bottom right of the screen), then **Do not disturb**.
4. Make sure the **Google Translate extension** is on, set to translate PayPal's pages into English (the test buyer's PayPal pages are in Arabic).
5. Open these tabs, in this order:
   1. https://stallfront.onrender.com
   2. https://stallfront.onrender.com/s/corner-stall
   3. https://stallfront.onrender.com/s/corner-stall/dashboard
   4. https://stallfront.onrender.com/new
   5. https://github.com/Owolabenjade/stallfront (scroll down to the "How it works" diagram)
6. In each tab press **Ctrl and +** once (zoom 110 to 125%). Check that the big headings still fit.
7. Have the sandbox buyer email and password ready to paste (from the README "Try it" section).
8. Read the script aloud once with a timer.

## Script (about 370 words, roughly 2:45 with the actions)

| Time | Tab | What to do on screen | What to say |
|---|---|---|---|
| 0:00 to 0:15 | 1 Home | Show the page, scroll slowly past the photos | "AI assistants are starting to shop for people. But an assistant can only buy where a shop gives it tools to call, and PayPal's own agent-ready checkout is limited to its Store Sync merchants today. A maker who sells a few things through Instagram posts and PayPal links gets left out." |
| 0:15 to 0:25 | 1 Home | Point at the headline | "Stallfront turns product photos into a PayPal shop that AI agents can buy from, and the buyer still approves every payment in PayPal." |
| 0:25 to 1:20 | 2 Shop | Point at the "Open to AI shopping assistants" box. Click the suggestion "New job on Monday…". Wait for the steps and the "Ready to pay" card. Click **Review and pay in PayPal**, log in as the sandbox buyer, click the pay button. Wait for the receipt | "This is Corner Stall, a demo shop made from six product photos. The page is open to AI shopping assistants. I ask the built-in assistant: new job on Monday, get me a leather work bag and a jacket, under two hundred and eighty dollars for both. It searches the shop, picks the briefcase and the denim jacket, and gets a PayPal checkout ready. That's a real PayPal order, but the assistant can't pay. I review it in PayPal, sign in as the test buyer, and approve. Back on Stallfront, the payment has gone through, and here's the PayPal payment ID." |
| 1:20 to 1:40 | 3 Seller view | Show the new paid order at the top. Click "What the assistant did". Point at the other order, placed by a connected AI app | "The seller sees every order: whether an assistant placed it on the shop page or an AI app connected from outside, which one it was, and each step it took." |
| 1:40 to 2:15 | 4 New shop | Click "Use our four sample photos", then **Write my listings**. (Cut the wait in editing.) On the review page, point at "Check before you publish", change one price, then click **Publish my shop** and show "Registered with PayPal" | "Opening a shop starts with photos. A vision model writes each listing: title, description, price, and the words shoppers search for. It flags what it can't tell from a photo, like size or materials, and I set my own price. When I publish, every product is registered with PayPal, and the shop is open to AI assistants." |
| 2:15 to 2:35 | 5 GitHub | Show the diagram, then scroll to "Proof" | "Under the hood: PayPal Orders for checkout and capture, PayPal Catalog Products for listings, Groq models for the assistant and the photo drafts, WebMCP on the page and MCP for every other agent, hosted on Render." |
| 2:35 to 2:50 | 1 Home | Back to the home page | "We tested it ten times on the live site, and it reached the right checkout every time, in under four seconds. Stallfront: turn product photos into a PayPal shop AI agents can buy from. Try it at stallfront dot onrender dot com." |

## Recording with Clipchamp (built into Windows 11)
1. Open the Start menu, type **Clipchamp**, open it. Sign in with your Microsoft account if asked.
2. Click **Create a new video**.
3. On the left, click **Record & create**, then **Screen**. Allow the microphone. Choose the browser window and click **Share**.
4. Record one row of the script at a time: click record, do the actions while reading the words, click stop. If you stumble, delete that clip and record the row again.
5. The clips land on the timeline in order. To cut a wait (for example while listings are written): click the clip, move the playhead to the start of the wait, press **S** to split, move to the end of the wait, press **S** again, select the middle piece and press **Delete**. If you speed a part up instead, add a small text "sped up" over it.
6. Captions: click **Captions** on the right, then **Turn on auto captions**. Read them once and fix any wrong words.
7. Add a 2-second title card at the start (Text, "Stallfront", "Turn product photos into a PayPal shop AI agents can buy from") and an end card with https://stallfront.onrender.com.
8. Check the total length at the bottom: it must be under 3:00.
9. Click **Export**, choose **1080p**.

## Upload to YouTube
1. Go to https://studio.youtube.com, click **Create**, then **Upload videos**, and pick the exported file.
2. Title: `Stallfront: turn product photos into a PayPal shop AI agents can buy from`
3. Description:
   ```
   Stallfront turns product photos into a PayPal shop that AI agents can buy from, through WebMCP and MCP tools, with the buyer approving every payment in PayPal. Built for the PayPal AI Hackathon.
   Live demo: https://stallfront.onrender.com
   Code: https://github.com/Owolabenjade/stallfront
   ```
4. "No, it's not made for kids." Visibility: **Public**. Publish.
5. Open the link in a private window (Ctrl + Shift + N) to check it plays without signing in. Send the link to Claude.

## Fallbacks
- If the assistant takes more than 15 seconds or says the AI plan is busy: wait 30 seconds and click the suggestion again (the free AI plan limits requests per minute).
- If writing listings pauses ("Short pause…"): it continues by itself; cut the wait in editing.
- If the site is slow on first load: it was asleep; wait a minute and reload.
