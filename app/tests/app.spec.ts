import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

// Helper to connect wallet
async function connectWallet(page: Page) {
  const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  await connectBtn.click();
  
  const devWalletBtn = page.getByRole('button', { name: /DevWallet/i });
  await expect(devWalletBtn).toBeVisible();
  await devWalletBtn.click();
}

const TEST_PARCEL_ID = `TEST-${Date.now()}`;

test.describe('TerraLedger E2E', () => {
  test.describe.configure({ mode: 'serial' });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.addInitScript(() => {
      window.localStorage.setItem('terraledger_tour_seen', 'true');
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Landing Page Loads', async () => {
    await page.goto('/');
    await expect(page.getByText(/TerraLedger/i).first()).toBeVisible({ timeout: 30000 });
    const launchAppBtn = page.getByRole('button', { name: /Open Dashboard/i }).first();
    await expect(launchAppBtn).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/1-landing-page.png' });
  });

  test('2. Wallet Connection', async () => {
    await page.goto('/dashboard');
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
    await expect(connectBtn).toBeVisible();
    await connectWallet(page);
    await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/8d4A/i).first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'tests/screenshots/2-wallet-connected.png' });
  });

  test('3. Parcel Registration Flow', async () => {
    await page.goto('/dashboard');

    // Wait for RoleGuard loading state to disappear
    await expect(page.getByText(/Checking your on-chain permissions/i)).not.toBeVisible({ timeout: 30000 });

    // Ensure wallet is connected
    await expect(page.locator('#wallet-connected-btn')).toBeVisible({ timeout: 15000 });

    // Ensure dashboard header is visible
    await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 15000 });

    // Navigate to My Parcels tab using the large CTA button on Overview
    // This button directly calls setActiveTab('parcels')
    const registerParcelBtn = page.getByRole('button', { name: /Register Parcel/i }).first();
    await registerParcelBtn.click();

    // Wait for New Registration button to appear in the Parcels view
    const registerBtn = page.getByRole('button', { name: /New Registration/i }).first();
    await expect(registerBtn).toBeVisible({ timeout: 45000 });
    await registerBtn.click();
    console.log('Clicked New Registration');
    // Step 1: Map Interaction
    const mapElement = page.locator('.leaflet-container');
    await expect(mapElement).toBeVisible({ timeout: 20000 });
    
    // Simulate drawing a polygon
    const box = await mapElement.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      await page.mouse.click(centerX - 50, centerY - 50); // point 1
      await page.mouse.click(centerX + 50, centerY - 50); // point 2
      await page.mouse.click(centerX + 50, centerY + 50); // point 3
      await page.waitForTimeout(500); // Small delay before double click as requested
      await page.mouse.dblclick(centerX - 50, centerY - 50); // close
    }

    // Assert ParcelInfoCard appears
    await expect(page.getByText(/Generated Parcel ID/i)).toBeVisible({ timeout: 10000 });
    const generatedId = await page.locator('code').first().textContent();
    expect(generatedId).toMatch(/TL-[\d.]+-[\d.]+/);

    await page.getByRole('button', { name: /Confirm Location/i }).click();

    // Step 2: Details & Documents
    const createMultisigBtn = page.getByRole('button', { name: /Provision Institutional Multisig/i });
    if (await createMultisigBtn.isVisible()) {
      await createMultisigBtn.click();
      await expect(page.getByText(/Provisioned/i).first()).toBeVisible({ timeout: 45000 });
      await page.waitForTimeout(2000);
    }

    // Step 3: Registration
    await page.getByRole('button', { name: /Continue to Registry/i }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy.pdf'));

    await page.getByRole('button', { name: /Submit Registry/i }).last().click({ force: true });

    const successToast = page.getByText(/Registered on-chain/i).first();
    const errorToast = page.getByText(/Registration Failed/i).first();
    const invalidToast = page.getByText(/Invalid Input/i).first();
    
    await expect(successToast.or(errorToast).or(invalidToast)).toBeVisible({ timeout: 60000 });
    
    if (await errorToast.isVisible()) {
      throw new Error('Transaction failed on-chain');
    }
    if (await invalidToast.isVisible()) {
      throw new Error('Form validation failed: Invalid Input');
    }

    await expect(page.getByText(TEST_PARCEL_ID).first().or(page.getByText(/TL-/i).first())).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/PendingVerification/i).first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/3-parcel-registered.png' });
  });

  test('4. Verifier / Activation Flow', async () => {
    await page.goto('/verifier');
    const parcelIdText = page.getByText(/TL-/i).first();
    await expect(parcelIdText).toBeVisible({ timeout: 20000 });
    await parcelIdText.click();

    const activateBtn = page.getByRole('button', { name: /Activate/i }).first();
    await activateBtn.click();

    await expect(page.getByText(/Parcel Activated!/i).first()).toBeVisible({ timeout: 60000 });

    await page.goto('/dashboard');
    const parcelsTab = page.locator('#dash-nav-parcels');
    if (await parcelsTab.isVisible()) {
      await parcelsTab.click();
    }
    
    await expect(page.getByText(/TL-/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Active/i).first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/4-verifier-activated.png' });
  });

  test('5. Fractional Transfer Flow', async () => {
    const parcelRow = page.getByText(/TL-/i).first();
    await expect(parcelRow).toBeVisible({ timeout: 20000 });
    await parcelRow.click();

    const transferTabBtn = page.getByRole('button', { name: /Transfer Stake/i }).first();
    if (await transferTabBtn.isVisible()) {
      await transferTabBtn.click();
    }

    await page.getByPlaceholder(/Recipient/i).fill('So11111111111111111111111111111111111111112');

    const signTransferBtn = page.getByRole('button', { name: /Sign Transfer/i });
    await signTransferBtn.click();

    await expect(page.getByText(/Stake Transferred/i).first()).toBeVisible({ timeout: 60000 });

    await page.screenshot({ path: 'tests/screenshots/5-fractional-transfer.png' });
  });

  test('6. Document Update Flow', async () => {
    const parcelRow = page.getByText(/TL-/i).first();
    await expect(parcelRow).toBeVisible({ timeout: 20000 });
    await parcelRow.click();

    const updateDocBtn = page.getByRole('button', { name: /Update Doc/i }).first();
    await updateDocBtn.click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy_v2.pdf'));

    const submitUpdateBtn = page.getByRole('button', { name: /Submit on-chain/i }).last();
    await submitUpdateBtn.click();

    await expect(page.getByText(/Document Updated/i).first()).toBeVisible({ timeout: 60000 });

    await page.screenshot({ path: 'tests/screenshots/6-document-updated.png' });
  });

  test('7. Raise Dispute Flow', async () => {
    const parcelRow = page.getByText(/TL-/i).first();
    await expect(parcelRow).toBeVisible({ timeout: 20000 });
    await parcelRow.click();

    const disputeBtn = page.getByRole('button', { name: /Raise Dispute/i }).first();
    await disputeBtn.click();

    const confirmDisputeBtn = page.getByRole('button', { name: /Raise Dispute/i }).last();
    await confirmDisputeBtn.click();

    await expect(page.getByText(/Dispute Raised/i).first()).toBeVisible({ timeout: 60000 });

    await expect(page.getByText(/Disputed/i).first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/7-dispute-raised.png' });
  });

  test('9. Navigation and Responsiveness', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Open Dashboard/i }).first()).toBeVisible();

    await page.goto('/dashboard');
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
    if (await connectBtn.isVisible()) {
      await connectWallet(page);
    }
    await expect(page.getByText(/8d4A/i).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/9-mobile-responsive.png' });
    
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('10. Error Handling', async () => {
    await page.goto('/dashboard');
    const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
    if (await connectBtn.isVisible()) {
      await connectWallet(page);
    }
    
    // Wait for RoleGuard loading state to disappear
    await expect(page.getByText(/Checking your on-chain permissions/i)).not.toBeVisible({ timeout: 30000 });
    const parcelsTab = page.locator('#dash-nav-parcels');
    if (await parcelsTab.isVisible()) {
      await parcelsTab.click();
    }

    const registerBtn = page.getByRole('button', { name: /New Registration/i }).first();
    await registerBtn.click();

    // Skip map and try to proceed
    await page.getByRole('button', { name: /Confirm Location/i }).click();
    // It should be blocked or show error
    // In our implementation, Step 1 must be completed.
    // Let's just try to submit empty registry via manual override
    setRegistrationStepTo2(page);
    
    await page.getByRole('button', { name: /Submit Registry/i }).last().click();

    await expect(page.getByText(/Invalid Input/i).first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/10-error-validation.png' });
  });

  test('11. API Health Check', async () => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});

async function setRegistrationStepTo2(page: Page) {
    // Helper to bypass map for error testing if needed
    // But since we enforced steps, we might need to actually draw something or click "Edit Manually"
    const editManuallyBtn = page.getByRole('button', { name: /Edit Manually/i }).first();
    if (await editManuallyBtn.isVisible()) {
        await editManuallyBtn.click();
    }
}
