import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'apartment-layout-planner:v1';

async function seedPlanner(page: Parameters<typeof test>[0]['page'], items: unknown[] = []) {
  await page.addInitScript(
    ({ key, plannerItems }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          activeLayoutId: 'layout-1',
          layouts: [
            {
              id: 'layout-1',
              name: 'Move Plan',
              updatedAt: '2026-04-08T00:00:00.000Z',
              items: plannerItems,
            },
          ],
        }),
      );
    },
    { key: STORAGE_KEY, plannerItems: items },
  );
}

async function longPressCanvas(page: Parameters<typeof test>[0]['page']) {
  const canvas = page.locator('.konvajs-content').first();
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas not found');
  }

  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.55;

  await page.dispatchEvent('.konvajs-content', 'touchstart', {
    touches: [{ identifier: 1, clientX: x, clientY: y }],
    changedTouches: [{ identifier: 1, clientX: x, clientY: y }],
  });
  await page.waitForTimeout(450);

  return { x, y };
}

test('mobile panels toggle cleanly with no items', async ({ page }) => {
  await seedPlanner(page);
  await page.goto('/');

  await page.getByTestId('mobile-panel-items').click();
  await expect(page.getByText('No items yet. Add one from the Add tab.')).toBeVisible();

  await page.getByTestId('mobile-panel-items').click();
  await expect(page.getByText('No items yet. Add one from the Add tab.')).toBeHidden();

  await page.getByTestId('mobile-panel-layouts').click();
  await expect(page.getByText('New Layout')).toBeVisible();

  await page.getByTestId('mobile-panel-layouts').click();
  await expect(page.getByText('New Layout')).toBeHidden();
});

test('selected panel remains usable with existing items', async ({ page }) => {
  await seedPlanner(page, [
    {
      id: 'item-1',
      label: 'Sofa',
      widthCm: 220,
      heightCm: 95,
      color: '#5f8f6e',
      xCm: 50,
      yCm: 50,
      rotation: 0,
    },
  ]);
  await page.goto('/');

  await page.getByTestId('mobile-panel-items').click();
  await page.locator('.itemCard').first().click();

  await expect(page.getByLabel('Label')).toHaveValue('Sofa');
  await page.getByTestId('mobile-panel-edit').click();
  await expect(page.getByLabel('Label')).toBeHidden();
});

test('long press opens the ring menu and can place an item', async ({ page }) => {
  await seedPlanner(page);
  await page.goto('/');

  await longPressCanvas(page);
  await expect(page.getByTestId('ring-menu-overlay')).toBeVisible();

  const sofaButton = page.getByTestId('ring-menu-item-sofa');
  const sofaBox = await sofaButton.boundingBox();
  if (!sofaBox) {
    throw new Error('Ring menu sofa item not found');
  }

  const x = sofaBox.x + sofaBox.width / 2;
  const y = sofaBox.y + sofaBox.height / 2;
  await page.dispatchEvent('[data-testid="ring-menu-overlay"]', 'pointermove', {
    pointerType: 'touch',
    clientX: x,
    clientY: y,
  });
  await page.dispatchEvent('[data-testid="ring-menu-overlay"]', 'pointerup', {
    pointerType: 'touch',
    clientX: x,
    clientY: y,
  });

  await expect(page.getByTestId('ring-menu-overlay')).toBeHidden();
  await expect(page.getByText('1 item(s)')).toBeVisible();
});
