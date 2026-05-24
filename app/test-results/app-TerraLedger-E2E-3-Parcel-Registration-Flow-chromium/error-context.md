# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TerraLedger E2E >> 3. Parcel Registration Flow
- Location: tests/app.spec.ts:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /New Registration/i }).first()
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('button', { name: /New Registration/i }).first()

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import * as path from 'path';
  3   | 
  4   | // Helper to connect wallet
  5   | async function connectWallet(page: Page) {
  6   |   const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  7   |   await connectBtn.click();
  8   |   
  9   |   const devWalletBtn = page.getByRole('button', { name: /DevWallet/i });
  10  |   await expect(devWalletBtn).toBeVisible();
  11  |   await devWalletBtn.click();
  12  | }
  13  | 
  14  | const TEST_PARCEL_ID = `TEST-${Date.now()}`;
  15  | 
  16  | test.describe('TerraLedger E2E', () => {
  17  |   test.describe.configure({ mode: 'serial' });
  18  |   let page: Page;
  19  | 
  20  |   test.beforeAll(async ({ browser }) => {
  21  |     page = await browser.newPage();
  22  |     await page.addInitScript(() => {
  23  |       window.localStorage.setItem('terraledger_tour_seen', 'true');
  24  |     });
  25  |   });
  26  | 
  27  |   test.afterAll(async () => {
  28  |     await page.close();
  29  |   });
  30  | 
  31  |   test('1. Landing Page Loads', async () => {
  32  |     await page.goto('/');
  33  |     await expect(page.getByText(/TerraLedger/i).first()).toBeVisible({ timeout: 30000 });
  34  |     const launchAppBtn = page.getByRole('button', { name: /Open Dashboard/i }).first();
  35  |     await expect(launchAppBtn).toBeVisible({ timeout: 15000 });
  36  |     await page.screenshot({ path: 'tests/screenshots/1-landing-page.png' });
  37  |   });
  38  | 
  39  |   test('2. Wallet Connection', async () => {
  40  |     await page.goto('/dashboard');
  41  |     const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  42  |     await expect(connectBtn).toBeVisible();
  43  |     await connectWallet(page);
  44  |     await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 30000 });
  45  |     await expect(page.getByText(/8d4A/i).first()).toBeVisible({ timeout: 10000 });
  46  |     await page.screenshot({ path: 'tests/screenshots/2-wallet-connected.png' });
  47  |   });
  48  | 
  49  |   test('3. Parcel Registration Flow', async () => {
  50  |     await page.goto('/dashboard');
  51  | 
  52  |     // Wait for RoleGuard loading state to disappear
  53  |     await expect(page.getByText(/Checking your on-chain permissions/i)).not.toBeVisible({ timeout: 30000 });
  54  | 
  55  |     // Ensure wallet is connected
  56  |     await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 15000 });
  57  | 
  58  |     // Ensure dashboard header is visible
  59  |     await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 15000 });
  60  | 
  61  |     // Navigate to My Parcels tab using the large CTA button on Overview
  62  |     // This button directly calls setActiveTab('parcels')
  63  |     const registerParcelBtn = page.getByRole('button', { name: /Register Parcel/i }).first();
  64  |     await registerParcelBtn.click();
  65  | 
  66  |     // Wait for New Registration button to appear in the Parcels view
  67  |     const registerBtn = page.getByRole('button', { name: /New Registration/i }).first();
> 68  |     await expect(registerBtn).toBeVisible({ timeout: 45000 });
      |                               ^ Error: expect(locator).toBeVisible() failed
  69  |     await registerBtn.click();
  70  |     console.log('Clicked New Registration');
  71  |     // Step 1: Map Interaction
  72  |     const mapElement = page.locator('.leaflet-container');
  73  |     await expect(mapElement).toBeVisible({ timeout: 20000 });
  74  |     
  75  |     // Simulate drawing a polygon
  76  |     const box = await mapElement.boundingBox();
  77  |     if (box) {
  78  |       const centerX = box.x + box.width / 2;
  79  |       const centerY = box.y + box.height / 2;
  80  |       
  81  |       await page.mouse.click(centerX - 50, centerY - 50); // point 1
  82  |       await page.mouse.click(centerX + 50, centerY - 50); // point 2
  83  |       await page.mouse.click(centerX + 50, centerY + 50); // point 3
  84  |       await page.waitForTimeout(500); // Small delay before double click as requested
  85  |       await page.mouse.dblclick(centerX - 50, centerY - 50); // close
  86  |     }
  87  | 
  88  |     // Assert ParcelInfoCard appears
  89  |     await expect(page.getByText(/Generated Parcel ID/i)).toBeVisible({ timeout: 10000 });
  90  |     const generatedId = await page.locator('code').first().textContent();
  91  |     expect(generatedId).toMatch(/TL-[\d.]+-[\d.]+/);
  92  | 
  93  |     await page.getByRole('button', { name: /Confirm Location/i }).click();
  94  | 
  95  |     // Step 2: Details & Documents
  96  |     const createMultisigBtn = page.getByRole('button', { name: /Provision Institutional Multisig/i });
  97  |     if (await createMultisigBtn.isVisible()) {
  98  |       await createMultisigBtn.click();
  99  |       await expect(page.getByText(/Provisioned/i).first()).toBeVisible({ timeout: 45000 });
  100 |       await page.waitForTimeout(2000);
  101 |     }
  102 | 
  103 |     // Step 3: Registration
  104 |     await page.getByRole('button', { name: /Continue to Registry/i }).click();
  105 | 
  106 |     const fileChooserPromise = page.waitForEvent('filechooser');
  107 |     await page.locator('input[type="file"]').click();
  108 |     const fileChooser = await fileChooserPromise;
  109 |     await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy.pdf'));
  110 | 
  111 |     await page.getByRole('button', { name: /Submit Registry/i }).last().click({ force: true });
  112 | 
  113 |     const successToast = page.getByText(/Registered on-chain/i).first();
  114 |     const errorToast = page.getByText(/Registration Failed/i).first();
  115 |     const invalidToast = page.getByText(/Invalid Input/i).first();
  116 |     
  117 |     await expect(successToast.or(errorToast).or(invalidToast)).toBeVisible({ timeout: 60000 });
  118 |     
  119 |     if (await errorToast.isVisible()) {
  120 |       throw new Error('Transaction failed on-chain');
  121 |     }
  122 |     if (await invalidToast.isVisible()) {
  123 |       throw new Error('Form validation failed: Invalid Input');
  124 |     }
  125 | 
  126 |     await expect(page.getByText(TEST_PARCEL_ID).first().or(page.getByText(/TL-/i).first())).toBeVisible({ timeout: 15000 });
  127 |     await expect(page.getByText(/PendingVerification/i).first()).toBeVisible();
  128 | 
  129 |     await page.screenshot({ path: 'tests/screenshots/3-parcel-registered.png' });
  130 |   });
  131 | 
  132 |   test('4. Verifier / Activation Flow', async () => {
  133 |     await page.goto('/verifier');
  134 |     const parcelIdText = page.getByText(/TL-/i).first();
  135 |     await expect(parcelIdText).toBeVisible({ timeout: 20000 });
  136 |     await parcelIdText.click();
  137 | 
  138 |     const activateBtn = page.getByRole('button', { name: /Activate/i }).first();
  139 |     await activateBtn.click();
  140 | 
  141 |     await expect(page.getByText(/Parcel Activated!/i).first()).toBeVisible({ timeout: 60000 });
  142 | 
  143 |     await page.goto('/dashboard');
  144 |     const parcelsTab = page.locator('#dash-nav-parcels');
  145 |     if (await parcelsTab.isVisible()) {
  146 |       await parcelsTab.click();
  147 |     }
  148 |     
  149 |     await expect(page.getByText(/TL-/i).first()).toBeVisible({ timeout: 15000 });
  150 |     await expect(page.getByText(/Active/i).first()).toBeVisible();
  151 | 
  152 |     await page.screenshot({ path: 'tests/screenshots/4-verifier-activated.png' });
  153 |   });
  154 | 
  155 |   test('5. Fractional Transfer Flow', async () => {
  156 |     const parcelRow = page.getByText(/TL-/i).first();
  157 |     await expect(parcelRow).toBeVisible({ timeout: 20000 });
  158 |     await parcelRow.click();
  159 | 
  160 |     const transferTabBtn = page.getByRole('button', { name: /Transfer Stake/i }).first();
  161 |     if (await transferTabBtn.isVisible()) {
  162 |       await transferTabBtn.click();
  163 |     }
  164 | 
  165 |     await page.getByPlaceholder(/Recipient/i).fill('So11111111111111111111111111111111111111112');
  166 | 
  167 |     const signTransferBtn = page.getByRole('button', { name: /Sign Transfer/i });
  168 |     await signTransferBtn.click();
```