# Bayesian BWM Survey (GitHub Pages + Google Apps Script)

This project is a deploy-ready survey app for collecting expert judgments for:
- SCPO (Supply Chain Practices and Outcomes)
- SESI (Social-Economic-Sustainability Impact)

It captures:
- Responder demographic information (age range, gender, education, experience, job title, organization, industry sector, country/region)
- Best criterion (selected per row via radio button)
- Worst criterion (selected per row via radio button)
- Best vs Criterion scores (1-9)
- Criterion vs Worst scores (1-9)

Each objective (SCPO and SESI) is a fully separate section with its own scoring table, so an expert's Best/Worst picks for one objective never affect the other.

The app enforces core BWM rules before submit.

## 1) Files

- `index.html`: Survey UI
- `styles.css`: Styling
- `app.js`: Validation + submit logic
- `config.example.js`: Example backend config
- `config.js`: Your actual config (Apps Script URL)

## 2) Publish to GitHub Pages

### 2.1 Push the code to a GitHub repository

**Option A — Git command line:**

```bash
cd survey-app
git init
git add .
git commit -m "Initial survey app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

**Option B — GitHub website (no Git needed):**
1. Go to [github.com/new](https://github.com/new) and create a new repository (public or private).
2. Click **Add file > Upload files**, drag in every file from `survey-app/` (including subfolders), then **Commit changes**.

> `config.js` is listed in [.gitignore](.gitignore) so plain `git add .` / `git push` will skip it. Either:
> - remove the `config.js` line from `.gitignore` before committing so it's included, or
> - after the first push, use GitHub's web editor (**Add file > Create new file**, name it `config.js`) to create it directly in the repo — the web editor ignores `.gitignore`.
>
> Do this step again whenever you update the Apps Script URL (see step 3.5 below).

### 2.2 Turn on GitHub Pages

1. In the repository, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **Deploy from a branch**.
3. Under **Branch**, select `main` and folder `/ (root)` (or `/survey-app` if the app lives in a subfolder of a bigger repo), then **Save**.
4. Wait a minute for the build to finish, then open the URL shown at the top of the Pages settings page — it looks like `https://<your-username>.github.io/<your-repo>/`.

### 2.3 Test it

Open the published URL, fill the form, and click **Validate**. If `config.js` has no Apps Script URL yet, **Submit Response** will download a JSON file instead of sending data — that's expected until section 3 is done.

## 3) Google Apps Script + Google Sheet Setup

### 3.1 Create the sheet

1. Create a new Google Sheet (sheets.new).
2. Rename the first tab to `Responses`.
3. Add a header row matching the columns appended in step 3.3 below (Timestamp, Expert Code, Invite Token, Age Range, Gender, Education, Years Experience, Job Title, Organization, Industry Sector, Country, SCPO Best, SCPO Worst, SCPO Best Vs, SCPO Vs Worst, SESI Best, SESI Worst, SESI Best Vs, SESI Vs Worst, Submitted At).

### 3.2 Open Apps Script

In the Sheet, go to **Extensions > Apps Script**. This opens a script bound to the spreadsheet.

### 3.3 Add the `doPost` handler

Replace the default code with:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");

    sheet.appendRow([
      new Date(),
      data.expertCode,
      data.inviteToken,
      data.demographics.ageRange,
      data.demographics.gender,
      data.demographics.education,
      data.demographics.yearsExperience,
      data.demographics.jobTitle,
      data.demographics.organization,
      data.demographics.industrySector,
      data.demographics.country,
      data.scpo.best,
      data.scpo.worst,
      JSON.stringify(data.scpo.bestVs),
      JSON.stringify(data.scpo.vsWorst),
      data.sesi.best,
      data.sesi.worst,
      JSON.stringify(data.sesi.bestVs),
      JSON.stringify(data.sesi.vsWorst),
      data.submittedAt
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Click the save icon (or `Ctrl+S`) and give the project a name, e.g. "BWM Survey Backend".

### 3.4 Deploy as a web app

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. The first time, Google will ask you to **authorize the script** — click **Authorize access**, pick your account, then **Advanced > Go to (project name)** and **Allow** (this warning appears because it's your own unverified script).
6. Copy the generated **Web app URL** (ends with `/exec`).

### 3.5 Connect the app to the deployment

1. Locally, copy `config.example.js` to `config.js` (if you haven't already) and set:
   ```javascript
   window.SURVEY_CONFIG = {
     appScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
   };
   ```
2. Push/upload the updated `config.js` to GitHub (see the note in step 2.1 about `.gitignore`).
3. Reload the published GitHub Pages URL and submit a test response — a new row should appear in the `Responses` sheet.

### 3.6 Redeploying after code changes

If you edit the `doPost` function later, the existing `/exec` URL keeps working only if you use **Deploy > Manage deployments > (pencil icon) > New version > Deploy**. Creating a brand-new deployment instead generates a new URL, which means you'd also need to update `config.js` again.

## 4) Validation Rules Implemented

- Every score must be an integer in [1, 9].
- Best and Worst must be different for each objective.
- Best vs Best must be 1.
- Worst vs Worst must be 1.
- All responder demographic fields and expert code / invite token are required.

## 5) Data Export

Data lands directly in the linked Google Sheet as new rows via the Apps Script `doPost` handler above. Use standard Sheets tools (filters, pivot tables, Query) to analyze results.

## 6) Pilot Mode Without Backend

If `config.js` has an empty `appScriptUrl`, submit will download a JSON response file instead. This is useful for early pilot tests before the Apps Script deployment is ready.

