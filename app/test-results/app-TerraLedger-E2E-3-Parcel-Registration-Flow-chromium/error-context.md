# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TerraLedger E2E >> 3. Parcel Registration Flow
- Location: tests/app.spec.ts:50:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#property-registry-header')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('#property-registry-header')

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
  22  |     page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  23  |     await page.addInitScript(() => {
  24  |       window.localStorage.setItem('terraledger_tour_seen', 'true');
  25  |     });
  26  |   });
  27  | 
  28  |   test.afterAll(async () => {
  29  |     await page.close();
  30  |   });
  31  | 
  32  |   test('1. Landing Page Loads', async () => {
  33  |     await page.goto('/');
  34  |     await expect(page.getByText(/TerraLedger/i).first()).toBeVisible({ timeout: 30000 });
  35  |     const launchAppBtn = page.getByRole('button', { name: /Open Dashboard/i }).first();
  36  |     await expect(launchAppBtn).toBeVisible({ timeout: 15000 });
  37  |     await page.screenshot({ path: 'tests/screenshots/1-landing-page.png' });
  38  |   });
  39  | 
  40  |   test('2. Wallet Connection', async () => {
  41  |     await page.goto('/dashboard');
  42  |     const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  43  |     await expect(connectBtn).toBeVisible();
  44  |     await connectWallet(page);
  45  |     await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 30000 });
  46  |     await expect(page.getByText(/8d4A/i).first()).toBeVisible({ timeout: 10000 });
  47  |     await page.screenshot({ path: 'tests/screenshots/2-wallet-connected.png' });
  48  |   });
  49  | 
  50  |   test('3. Parcel Registration Flow', async () => {
  51  |     await page.goto('/dashboard');
  52  |     
  53  |     // DevWallet state is not persistent across reloads in this mock setup
  54  |     const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  55  |     if (await connectBtn.isVisible()) {
  56  |       await connectWallet(page);
  57  |     }
  58  | 
  59  |     // Wait for RoleGuard loading state to disappear
  60  |     await expect(page.getByText(/Checking your on-chain permissions/i)).not.toBeVisible({ timeout: 30000 });
  61  |     
  62  |     // Ensure wallet is connected
  63  |     await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 15000 });
  64  |     
  65  |     // Navigate to My Parcels tab
  66  |     await page.getByRole('button', { name: /Register Parcel/i }).first().click();
  67  |     
  68  |     // Wait for ParcelsPage to mount
> 69  |     await expect(page.locator('#property-registry-header')).toBeVisible({ timeout: 30000 });
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  70  |     console.log('Registry header visible');
  71  | 
  72  |     const registerBtn = page.getByRole('button', { name: /New Registration/i }).first();
  73  |     await expect(registerBtn).toBeVisible({ timeout: 20000 });
  74  |     await registerBtn.click();
  75  |     console.log('Clicked New Registration');
  76  | 
  77  |     // Step 1: Map Interaction
  78  |     const mapElement = page.locator('.leaflet-container');
  79  |     await expect(mapElement).toBeVisible({ timeout: 20000 });
  80  |     
  81  |     // Simulate drawing a polygon
  82  |     const box = await mapElement.boundingBox();
  83  |     if (box) {
  84  |       const centerX = box.x + box.width / 2;
  85  |       const centerY = box.y + box.height / 2;
  86  |       
  87  |       await page.mouse.click(centerX - 50, centerY - 50); // point 1
  88  |       await page.mouse.click(centerX + 50, centerY - 50); // point 2
  89  |       await page.mouse.click(centerX + 50, centerY + 50); // point 3
  90  |       await page.waitForTimeout(500); // Small delay before double click as requested
  91  |       await page.mouse.dblclick(centerX - 50, centerY - 50); // close
  92  |     }
  93  | 
  94  |     // Assert ParcelInfoCard appears
  95  |     await expect(page.getByText(/Generated Parcel ID/i)).toBeVisible({ timeout: 10000 });
  96  |     const generatedId = await page.locator('code').first().textContent();
  97  |     expect(generatedId).toMatch(/TL-[\d.]+-[\d.]+/);
  98  | 
  99  |     await page.getByRole('button', { name: /Confirm Location/i }).click();
  100 | 
  101 |     // Step 2: Details & Documents
  102 |     const createMultisigBtn = page.getByRole('button', { name: /Provision Institutional Multisig/i });
  103 |     if (await createMultisigBtn.isVisible()) {
  104 |       await createMultisigBtn.click();
  105 |       await expect(page.getByText(/Provisioned/i).first()).toBeVisible({ timeout: 45000 });
  106 |       await page.waitForTimeout(2000);
  107 |     }
  108 | 
  109 |     // Step 3: Registration
  110 |     await page.getByRole('button', { name: /Continue to Registry/i }).click();
  111 | 
  112 |     const fileChooserPromise = page.waitForEvent('filechooser');
  113 |     await page.locator('input[type="file"]').click();
  114 |     const fileChooser = await fileChooserPromise;
  115 |     await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy.pdf'));
  116 | 
  117 |     await page.getByRole('button', { name: /Submit Registry/i }).last().click({ force: true });
  118 | 
  119 |     const successToast = page.getByText(/Registered on-chain/i).first();
  120 |     const errorToast = page.getByText(/Registration Failed/i).first();
  121 |     const invalidToast = page.getByText(/Invalid Input/i).first();
  122 |     
  123 |     await expect(successToast.or(errorToast).or(invalidToast)).toBeVisible({ timeout: 60000 });
  124 |     
  125 |     if (await errorToast.isVisible()) {
  126 |       throw new Error('Transaction failed on-chain');
  127 |     }
  128 |     if (await invalidToast.isVisible()) {
  129 |       throw new Error('Form validation failed: Invalid Input');
  130 |     }
  131 | 
  132 |     await expect(page.getByText(TEST_PARCEL_ID).first().or(page.getByText(/TL-/i).first())).toBeVisible({ timeout: 15000 });
  133 |     await expect(page.getByText(/PendingVerification/i).first()).toBeVisible();
  134 | 
  135 |     await page.screenshot({ path: 'tests/screenshots/3-parcel-registered.png' });
  136 |   });
  137 | 
  138 |   test('4. Verifier / Activation Flow', async () => {
  139 |     await page.goto('/verifier');
  140 |     const parcelIdText = page.getByText(/TL-/i).first();
  141 |     await expect(parcelIdText).toBeVisible({ timeout: 20000 });
  142 |     await parcelIdText.click();
  143 | 
  144 |     const activateBtn = page.getByRole('button', { name: /Activate/i }).first();
  145 |     await activateBtn.click();
  146 | 
  147 |     await expect(page.getByText(/Parcel Activated!/i).first()).toBeVisible({ timeout: 60000 });
  148 | 
  149 |     await page.goto('/dashboard');
  150 |     const parcelsTab = page.locator('#dash-nav-parcels');
  151 |     if (await parcelsTab.isVisible()) {
  152 |       await parcelsTab.click();
  153 |     }
  154 |     
  155 |     await expect(page.getByText(/TL-/i).first()).toBeVisible({ timeout: 15000 });
  156 |     await expect(page.getByText(/Active/i).first()).toBeVisible();
  157 | 
  158 |     await page.screenshot({ path: 'tests/screenshots/4-verifier-activated.png' });
  159 |   });
  160 | 
  161 |   test('5. Fractional Transfer Flow', async () => {
  162 |     const parcelRow = page.getByText(/TL-/i).first();
  163 |     await expect(parcelRow).toBeVisible({ timeout: 20000 });
  164 |     await parcelRow.click();
  165 | 
  166 |     const transferTabBtn = page.getByRole('button', { name: /Transfer Stake/i }).first();
  167 |     if (await transferTabBtn.isVisible()) {
  168 |       await transferTabBtn.click();
  169 |     }
```