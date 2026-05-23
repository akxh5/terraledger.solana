# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TerraLedger E2E >> 6. Document Update Flow
- Location: tests/app.spec.ts:143:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/V1/i).first()
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByText(/V1/i).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - paragraph [ref=e5]: Switch Portal
      - button "owner" [ref=e6] [cursor=pointer]:
        - img [ref=e7]
        - text: owner
      - button "verifier" [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - text: verifier
    - banner [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - link "TerraLedger TerraLedger" [ref=e19] [cursor=pointer]:
            - /url: /
            - img "TerraLedger" [ref=e20]
            - generic [ref=e21]: TerraLedger
          - navigation [ref=e22]:
            - button "Overview" [ref=e23] [cursor=pointer]:
              - img [ref=e24]
              - text: Overview
            - button "My Parcels" [ref=e29] [cursor=pointer]:
              - img [ref=e30]
              - text: My Parcels
            - button "Explorer" [ref=e33] [cursor=pointer]:
              - img [ref=e34]
              - text: Explorer
            - button "Docs" [ref=e38] [cursor=pointer]:
              - img [ref=e39]
              - text: Docs
        - button "8d4A...sEyp" [ref=e45] [cursor=pointer]:
          - generic [ref=e47]: 8d4A...sEyp
          - img [ref=e48]
    - main [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - generic [ref=e54]:
              - heading "Property Registry" [level=2] [ref=e55]:
                - img [ref=e56]
                - text: Property Registry
              - generic [ref=e59]:
                - button "Start Tour" [ref=e60] [cursor=pointer]:
                  - img
                  - text: Start Tour
                - button "New Registration" [ref=e61] [cursor=pointer]:
                  - img
                  - text: New Registration
            - generic [ref=e63]:
              - img [ref=e64]
              - textbox "Search registry..." [ref=e67]
          - table [ref=e70]:
            - rowgroup [ref=e71]:
              - row "Parcel ID Status Actions" [ref=e72]:
                - columnheader "Parcel ID" [ref=e73]
                - columnheader "Status" [ref=e74]
                - columnheader "Actions" [ref=e75]
            - rowgroup [ref=e76]:
              - row "TEST-1779432440269 Active Audit" [ref=e77] [cursor=pointer]:
                - cell "TEST-1779432440269" [ref=e78]
                - cell "Active" [ref=e79]:
                  - generic [ref=e80]: Active
                - cell "Audit" [ref=e81]:
                  - button "Audit" [ref=e82]
              - row "TEST-1779434277557 Disputed Audit" [ref=e83] [cursor=pointer]:
                - cell "TEST-1779434277557" [ref=e84]
                - cell "Disputed" [ref=e85]:
                  - generic [ref=e86]: Disputed
                - cell "Audit" [ref=e87]:
                  - button "Audit" [ref=e88]
              - row "TEST-1779432324921 Active Audit" [ref=e89] [cursor=pointer]:
                - cell "TEST-1779432324921" [ref=e90]
                - cell "Active" [ref=e91]:
                  - generic [ref=e92]: Active
                - cell "Audit" [ref=e93]:
                  - button "Audit" [ref=e94]
              - row "TEST-1779439520824 Active Audit" [ref=e95] [cursor=pointer]:
                - cell "TEST-1779439520824" [ref=e96]
                - cell "Active" [ref=e97]:
                  - generic [ref=e98]: Active
                - cell "Audit" [ref=e99]:
                  - button "Audit" [ref=e100]
              - row "TEST-1779440018768 Active Audit" [ref=e101] [cursor=pointer]:
                - cell "TEST-1779440018768" [ref=e102]
                - cell "Active" [ref=e103]:
                  - generic [ref=e104]: Active
                - cell "Audit" [ref=e105]:
                  - button "Audit" [ref=e106]
              - row "TEST-1779432762306 Active Audit" [ref=e107] [cursor=pointer]:
                - cell "TEST-1779432762306" [ref=e108]
                - cell "Active" [ref=e109]:
                  - generic [ref=e110]: Active
                - cell "Audit" [ref=e111]:
                  - button "Audit" [ref=e112]
              - row "TEST-1779439379329 Active Audit" [ref=e113] [cursor=pointer]:
                - cell "TEST-1779439379329" [ref=e114]
                - cell "Active" [ref=e115]:
                  - generic [ref=e116]: Active
                - cell "Audit" [ref=e117]:
                  - button "Audit" [ref=e118]
              - row "TEST-1779440830154 Active Audit" [ref=e119] [cursor=pointer]:
                - cell "TEST-1779440830154" [ref=e120]
                - cell "Active" [ref=e121]:
                  - generic [ref=e122]: Active
                - cell "Audit" [ref=e123]:
                  - button "Audit" [ref=e124]
              - row "TEST-1779434165526 Active Audit" [ref=e125] [cursor=pointer]:
                - cell "TEST-1779434165526" [ref=e126]
                - cell "Active" [ref=e127]:
                  - generic [ref=e128]: Active
                - cell "Audit" [ref=e129]:
                  - button "Audit" [ref=e130]
              - row "TEST-1779440517807 Active Audit" [ref=e131] [cursor=pointer]:
                - cell "TEST-1779440517807" [ref=e132]
                - cell "Active" [ref=e133]:
                  - generic [ref=e134]: Active
                - cell "Audit" [ref=e135]:
                  - button "Audit" [ref=e136]
              - row "TEST-1779432354094 Active Audit" [ref=e137] [cursor=pointer]:
                - cell "TEST-1779432354094" [ref=e138]
                - cell "Active" [ref=e139]:
                  - generic [ref=e140]: Active
                - cell "Audit" [ref=e141]:
                  - button "Audit" [ref=e142]
              - row "TEST-1779432600883 Active Audit" [ref=e143] [cursor=pointer]:
                - cell "TEST-1779432600883" [ref=e144]
                - cell "Active" [ref=e145]:
                  - generic [ref=e146]: Active
                - cell "Audit" [ref=e147]:
                  - button "Audit" [ref=e148]
              - row "TEST-1779432524634 Active Audit" [ref=e149] [cursor=pointer]:
                - cell "TEST-1779432524634" [ref=e150]
                - cell "Active" [ref=e151]:
                  - generic [ref=e152]: Active
                - cell "Audit" [ref=e153]:
                  - button "Audit" [ref=e154]
              - row "TEST-1779432889474 Active Audit" [ref=e155] [cursor=pointer]:
                - cell "TEST-1779432889474" [ref=e156]
                - cell "Active" [ref=e157]:
                  - generic [ref=e158]: Active
                - cell "Audit" [ref=e159]:
                  - button "Audit" [ref=e160]
              - row "TEST-1779439716921 PendingVerification Audit" [ref=e161] [cursor=pointer]:
                - cell "TEST-1779439716921" [ref=e162]
                - cell "PendingVerification" [ref=e163]:
                  - generic [ref=e164]: PendingVerification
                - cell "Audit" [ref=e165]:
                  - button "Audit" [ref=e166]
              - row "TEST-1779440360677 Active Audit" [ref=e167] [cursor=pointer]:
                - cell "TEST-1779440360677" [ref=e168]
                - cell "Active" [ref=e169]:
                  - generic [ref=e170]: Active
                - cell "Audit" [ref=e171]:
                  - button "Audit" [ref=e172]
              - row "TEST-1779432699093 Active Audit" [ref=e173] [cursor=pointer]:
                - cell "TEST-1779432699093" [ref=e174]
                - cell "Active" [ref=e175]:
                  - generic [ref=e176]: Active
                - cell "Audit" [ref=e177]:
                  - button "Audit" [ref=e178]
              - row "TEST-1779440944302 Active Audit" [ref=e179] [cursor=pointer]:
                - cell "TEST-1779440944302" [ref=e180]
                - cell "Active" [ref=e181]:
                  - generic [ref=e182]: Active
                - cell "Audit" [ref=e183]:
                  - button "Audit" [ref=e184]
              - row "TEST-1779440718603 Active Audit" [ref=e185] [cursor=pointer]:
                - cell "TEST-1779440718603" [ref=e186]
                - cell "Active" [ref=e187]:
                  - generic [ref=e188]: Active
                - cell "Audit" [ref=e189]:
                  - button "Audit" [ref=e190]
              - row "TEST-1779439268246 Active Audit" [ref=e191] [cursor=pointer]:
                - cell "TEST-1779439268246" [ref=e192]
                - cell "Active" [ref=e193]:
                  - generic [ref=e194]: Active
                - cell "Audit" [ref=e195]:
                  - button "Audit" [ref=e196]
              - row "TEST-1779434090086 Active Audit" [ref=e197] [cursor=pointer]:
                - cell "TEST-1779434090086" [ref=e198]
                - cell "Active" [ref=e199]:
                  - generic [ref=e200]: Active
                - cell "Audit" [ref=e201]:
                  - button "Audit" [ref=e202]
              - row "TEST-1779432931033 Active Audit" [ref=e203] [cursor=pointer]:
                - cell "TEST-1779432931033" [ref=e204]
                - cell "Active" [ref=e205]:
                  - generic [ref=e206]: Active
                - cell "Audit" [ref=e207]:
                  - button "Audit" [ref=e208]
              - row "TEST-1779434242475 Disputed Audit" [ref=e209] [cursor=pointer]:
                - cell "TEST-1779434242475" [ref=e210]
                - cell "Disputed" [ref=e211]:
                  - generic [ref=e212]: Disputed
                - cell "Audit" [ref=e213]:
                  - button "Audit" [ref=e214]
              - row "TEST-1779440238784 Active Audit" [ref=e215] [cursor=pointer]:
                - cell "TEST-1779440238784" [ref=e216]
                - cell "Active" [ref=e217]:
                  - generic [ref=e218]: Active
                - cell "Audit" [ref=e219]:
                  - button "Audit" [ref=e220]
              - row "TEST-1779432658530 Active Audit" [ref=e221] [cursor=pointer]:
                - cell "TEST-1779432658530" [ref=e222]
                - cell "Active" [ref=e223]:
                  - generic [ref=e224]: Active
                - cell "Audit" [ref=e225]:
                  - button "Audit" [ref=e226]
              - row "TEST-1779434309973 Disputed Audit" [ref=e227] [cursor=pointer]:
                - cell "TEST-1779434309973" [ref=e228]
                - cell "Disputed" [ref=e229]:
                  - generic [ref=e230]: Disputed
                - cell "Audit" [ref=e231]:
                  - button "Audit" [ref=e232]
              - row "TEST-1779439220728 PendingVerification Audit" [ref=e233] [cursor=pointer]:
                - cell "TEST-1779439220728" [ref=e234]
                - cell "PendingVerification" [ref=e235]:
                  - generic [ref=e236]: PendingVerification
                - cell "Audit" [ref=e237]:
                  - button "Audit" [ref=e238]
              - row "TEST-1779432283360 Active Audit" [ref=e239] [cursor=pointer]:
                - cell "TEST-1779432283360" [ref=e240]
                - cell "Active" [ref=e241]:
                  - generic [ref=e242]: Active
                - cell "Audit" [ref=e243]:
                  - button "Audit" [ref=e244]
              - row "TEST-1779434129327 Active Audit" [ref=e245] [cursor=pointer]:
                - cell "TEST-1779434129327" [ref=e246]
                - cell "Active" [ref=e247]:
                  - generic [ref=e248]: Active
                - cell "Audit" [ref=e249]:
                  - button "Audit" [ref=e250]
              - row "TEST-1779440131880 Active Audit" [ref=e251] [cursor=pointer]:
                - cell "TEST-1779440131880" [ref=e252]
                - cell "Active" [ref=e253]:
                  - generic [ref=e254]: Active
                - cell "Audit" [ref=e255]:
                  - button "Audit" [ref=e256]
              - row "TEST-1779440597047 Active Audit" [ref=e257] [cursor=pointer]:
                - cell "TEST-1779440597047" [ref=e258]
                - cell "Active" [ref=e259]:
                  - generic [ref=e260]: Active
                - cell "Audit" [ref=e261]:
                  - button "Audit" [ref=e262]
              - row "TEST-1779434207355 PendingVerification Audit" [ref=e263] [cursor=pointer]:
                - cell "TEST-1779434207355" [ref=e264]
                - cell "PendingVerification" [ref=e265]:
                  - generic [ref=e266]: PendingVerification
                - cell "Audit" [ref=e267]:
                  - button "Audit" [ref=e268]
              - row "TEST-1779441467913 Active Audit" [ref=e269] [cursor=pointer]:
                - cell "TEST-1779441467913" [ref=e270]
                - cell "Active" [ref=e271]:
                  - generic [ref=e272]: Active
                - cell "Audit" [ref=e273]:
                  - button "Audit" [ref=e274]
              - row "TEST-1779439861593 Active Audit" [ref=e275] [cursor=pointer]:
                - cell "TEST-1779439861593" [ref=e276]
                - cell "Active" [ref=e277]:
                  - generic [ref=e278]: Active
                - cell "Audit" [ref=e279]:
                  - button "Audit" [ref=e280]
              - row "TEST-1779441145701 Active Audit" [ref=e281] [cursor=pointer]:
                - cell "TEST-1779441145701" [ref=e282]
                - cell "Active" [ref=e283]:
                  - generic [ref=e284]: Active
                - cell "Audit" [ref=e285]:
                  - button "Audit" [ref=e286]
        - complementary [ref=e287]:
          - generic [ref=e288]:
            - heading "TEST-1779441467913" [level=3] [ref=e289]
            - button [ref=e290] [cursor=pointer]:
              - img [ref=e291]
          - generic [ref=e295]:
            - generic [ref=e296]:
              - 'generic "8d4AWN...sEyp: 99%" [ref=e297]'
              - 'generic "So1111...1112: 1%" [ref=e298]'
            - table [ref=e300]:
              - rowgroup [ref=e301]:
                - row "Stakeholder BPS Share" [ref=e302]:
                  - columnheader "Stakeholder" [ref=e303]
                  - columnheader "BPS" [ref=e304]
                  - columnheader "Share" [ref=e305]
              - rowgroup [ref=e306]:
                - row "8d4AWN...sEyp 9900 99.00%" [ref=e307]:
                  - cell "8d4AWN...sEyp" [ref=e308]:
                    - generic [ref=e310]: 8d4AWN...sEyp
                  - cell "9900" [ref=e311]
                  - cell "99.00%" [ref=e312]
                - row "So1111...1112 100 1.00%" [ref=e313]:
                  - cell "So1111...1112" [ref=e314]:
                    - generic [ref=e316]: So1111...1112
                  - cell "100" [ref=e317]
                  - cell "1.00%" [ref=e318]
          - generic [ref=e319]:
            - generic [ref=e320]:
              - generic [ref=e321]: Documents
              - button "Update Doc" [ref=e322] [cursor=pointer]:
                - img
                - text: Update Doc
            - link "QmdfUrogkqTkrK2NdaucQbbpa6sufgXX9MPQrhQ52AbGsW Current" [ref=e324] [cursor=pointer]:
              - /url: https://ipfs.io/ipfs/QmdfUrogkqTkrK2NdaucQbbpa6sufgXX9MPQrhQ52AbGsW
              - generic [ref=e325]:
                - img [ref=e326]
                - generic [ref=e330]: QmdfUrogkqTkrK2NdaucQbbpa6sufgXX9MPQrhQ52AbGsW
              - generic [ref=e331]: Current
          - generic [ref=e332]:
            - generic [ref=e333]:
              - textbox "Recipient" [ref=e334]
              - slider [ref=e338]
              - button "Sign Transfer" [ref=e339] [cursor=pointer]
            - generic [ref=e340]:
              - button "Lock Parcel" [ref=e341] [cursor=pointer]
              - button "Raise Dispute" [ref=e342] [cursor=pointer]
```

# Test source

```ts
  66  | 
  67  |     const fileChooserPromise = page.waitForEvent('filechooser');
  68  |     await page.locator('input[type="file"]').click();
  69  |     const fileChooser = await fileChooserPromise;
  70  |     await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy.pdf'));
  71  | 
  72  |     await page.getByRole('button', { name: /Submit Registry/i }).last().click({ force: true });
  73  | 
  74  |     const successToast = page.getByText(/Registered on-chain/i).first();
  75  |     const errorToast = page.getByText(/Registration Failed/i).first();
  76  |     const invalidToast = page.getByText(/Invalid Input/i).first();
  77  |     
  78  |     await expect(successToast.or(errorToast).or(invalidToast)).toBeVisible({ timeout: 60000 });
  79  |     
  80  |     if (await errorToast.isVisible()) {
  81  |       throw new Error('Transaction failed on-chain');
  82  |     }
  83  |     if (await invalidToast.isVisible()) {
  84  |       throw new Error('Form validation failed: Invalid Input');
  85  |     }
  86  | 
  87  |     await expect(page.getByText(TEST_PARCEL_ID).first()).toBeVisible({ timeout: 15000 });
  88  |     await expect(page.getByText(/PendingVerification/i).first()).toBeVisible();
  89  | 
  90  |     await page.screenshot({ path: 'tests/screenshots/3-parcel-registered.png' });
  91  |   });
  92  | 
  93  |   test('4. Verifier / Activation Flow', async () => {
  94  |     await page.goto('/verifier');
  95  |     const parcelIdText = page.getByText(TEST_PARCEL_ID).first();
  96  |     await expect(parcelIdText).toBeVisible({ timeout: 20000 });
  97  |     await parcelIdText.click();
  98  | 
  99  |     const activateBtn = page.getByRole('button', { name: /Activate/i }).first();
  100 |     await activateBtn.click();
  101 | 
  102 |     await expect(page.getByText(/Parcel Activated!/i).first()).toBeVisible({ timeout: 60000 });
  103 | 
  104 |     await expect(parcelIdText).not.toBeVisible({ timeout: 15000 });
  105 | 
  106 |     await page.goto('/dashboard');
  107 |     const parcelsTab = page.locator('#dash-nav-parcels');
  108 |     if (await parcelsTab.isVisible()) {
  109 |       await parcelsTab.click();
  110 |     }
  111 |     
  112 |     await expect(page.getByText(TEST_PARCEL_ID).first()).toBeVisible({ timeout: 15000 });
  113 |     await expect(page.getByText(/Active/i).first()).toBeVisible();
  114 | 
  115 |     await page.screenshot({ path: 'tests/screenshots/4-verifier-activated.png' });
  116 |   });
  117 | 
  118 |   test('5. Fractional Transfer Flow', async () => {
  119 |     const parcelRow = page.getByText(TEST_PARCEL_ID).first();
  120 |     await expect(parcelRow).toBeVisible({ timeout: 20000 });
  121 |     await parcelRow.click();
  122 | 
  123 |     const transferTabBtn = page.getByRole('button', { name: /Transfer Stake/i }).first();
  124 |     if (await transferTabBtn.isVisible()) {
  125 |       await transferTabBtn.click();
  126 |     }
  127 | 
  128 |     await page.getByPlaceholder(/Recipient/i).fill('So11111111111111111111111111111111111111112');
  129 | 
  130 |     const signTransferBtn = page.getByRole('button', { name: /Sign Transfer/i });
  131 |     await signTransferBtn.click();
  132 | 
  133 |     await expect(page.getByText(/Stake Transferred/i).first()).toBeVisible({ timeout: 60000 });
  134 | 
  135 |     const capTableText = page.getByText(/9900/i).first();
  136 |     await expect(capTableText).toBeVisible({ timeout: 15000 });
  137 |     const capTableText2 = page.getByText(/100/i).first();
  138 |     await expect(capTableText2).toBeVisible();
  139 | 
  140 |     await page.screenshot({ path: 'tests/screenshots/5-fractional-transfer.png' });
  141 |   });
  142 | 
  143 |   test('6. Document Update Flow', async () => {
  144 |     const parcelRow = page.getByText(TEST_PARCEL_ID).first();
  145 |     await expect(parcelRow).toBeVisible({ timeout: 20000 });
  146 |     await parcelRow.click();
  147 | 
  148 |     const updateDocBtn = page.getByRole('button', { name: /Update Doc/i }).first();
  149 |     await updateDocBtn.click();
  150 | 
  151 |     const fileChooserPromise = page.waitForEvent('filechooser');
  152 |     await page.locator('input[type="file"]').click();
  153 |     const fileChooser = await fileChooserPromise;
  154 |     await fileChooser.setFiles(path.resolve('tests', 'fixtures/dummy_v2.pdf'));
  155 | 
  156 |     const submitUpdateBtn = page.getByRole('button', { name: /Submit on-chain/i }).last();
  157 |     await submitUpdateBtn.click();
  158 | 
  159 |     await expect(page.getByText(/Document Updated/i).first()).toBeVisible({ timeout: 60000 });
  160 | 
  161 |     const historyTabBtn = page.getByRole('button', { name: /History/i }).first();
  162 |     if (await historyTabBtn.isVisible()) {
  163 |       await historyTabBtn.click();
  164 |     }
  165 | 
> 166 |     await expect(page.getByText(/V1/i).first()).toBeVisible({ timeout: 30000 });
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  167 | 
  168 |     await page.screenshot({ path: 'tests/screenshots/6-document-updated.png' });
  169 |   });
  170 | 
  171 |   test('7. Raise Dispute Flow', async () => {
  172 |     const parcelRow = page.getByText(TEST_PARCEL_ID).first();
  173 |     await expect(parcelRow).toBeVisible({ timeout: 20000 });
  174 |     await parcelRow.click();
  175 | 
  176 |     const settingsBtn = page.getByRole('button', { name: /Actions|Settings/i }).first();
  177 |     if (await settingsBtn.isVisible()) {
  178 |        await settingsBtn.click();
  179 |     }
  180 | 
  181 |     const disputeBtn = page.getByRole('button', { name: /Raise Dispute/i }).first();
  182 |     await disputeBtn.click();
  183 | 
  184 |     const confirmDisputeBtn = page.getByRole('button', { name: /Raise Dispute/i }).last();
  185 |     await confirmDisputeBtn.click();
  186 | 
  187 |     await expect(page.getByText(/Dispute Raised/i).first()).toBeVisible({ timeout: 60000 });
  188 | 
  189 |     await expect(page.getByText(/Disputed/i).first()).toBeVisible();
  190 | 
  191 |     const signTransferBtn = page.getByRole('button', { name: /Sign Transfer/i });
  192 |     if (await signTransferBtn.isVisible()) {
  193 |       await expect(signTransferBtn).toBeDisabled();
  194 |     }
  195 | 
  196 |     await page.screenshot({ path: 'tests/screenshots/7-dispute-raised.png' });
  197 |   });
  198 | 
  199 |   test.skip('8. Verifier Filtering', async () => {
  200 |     await page.goto('/verifier');
  201 |     await expect(page.getByText(TEST_PARCEL_ID)).not.toBeVisible({ timeout: 10000 });
  202 |     await expect(page.getByText(/No parcels pending verification/i)).toBeVisible();
  203 |     await page.screenshot({ path: 'tests/screenshots/8-verifier-filtering.png' });
  204 |   });
  205 | 
  206 |   test('9. Navigation and Responsiveness', async () => {
  207 |     await page.setViewportSize({ width: 375, height: 812 });
  208 |     await page.goto('/');
  209 |     await expect(page.getByRole('button', { name: /Open Dashboard/i }).first()).toBeVisible();
  210 | 
  211 |     await page.goto('/dashboard');
  212 |     const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  213 |     if (await connectBtn.isVisible()) {
  214 |       await connectWallet(page);
  215 |     }
  216 |     await expect(page.getByText(/8d4A/i).first()).toBeVisible();
  217 |     await page.screenshot({ path: 'tests/screenshots/9-mobile-responsive.png' });
  218 |     
  219 |     await page.setViewportSize({ width: 1280, height: 720 });
  220 |   });
  221 | 
  222 |   test('10. Error Handling', async () => {
  223 |     await page.goto('/dashboard');
  224 |     const connectBtn = page.getByRole('button', { name: /Connect Wallet/i }).first();
  225 |     if (await connectBtn.isVisible()) {
  226 |       await connectWallet(page);
  227 |     }
  228 |     const parcelsTab = page.locator('#dash-nav-parcels');
  229 |     if (await parcelsTab.isVisible()) {
  230 |       await parcelsTab.click();
  231 |     }
  232 | 
  233 |     const registerBtn = page.getByRole('button', { name: /New Registration/i }).first();
  234 |     await registerBtn.click();
  235 | 
  236 |     const submitBtn = page.getByRole('button', { name: /Submit Registry/i }).last();
  237 |     await submitBtn.click();
  238 | 
  239 |     await expect(page.getByText(/Invalid Input/i).first()).toBeVisible();
  240 |     await page.screenshot({ path: 'tests/screenshots/10-error-validation.png' });
  241 |   });
  242 | });
  243 | 
```