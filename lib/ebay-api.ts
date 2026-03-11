import eBayApi from 'ebay-api';
import type { EbayActiveListing } from '@/types';

let client: InstanceType<typeof eBayApi> | null = null;

function getClient(): InstanceType<typeof eBayApi> | null {
  if (client) return client;

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    return null;
  }

  client = new eBayApi({
    appId,
    certId,
    sandbox: false,
    siteId: eBayApi.SiteId.EBAY_US,
  });

  return client;
}

export async function searchActiveCardListings(
  cardName: string,
  setName: string,
  cardNumber?: string
): Promise<EbayActiveListing[]> {
  const ebay = getClient();
  if (!ebay) {
    return [];
  }

  const parts = ['pokemon', cardName, setName];
  if (cardNumber) parts.push(cardNumber);
  const query = parts.join(' ');

  try {
    const response = await ebay.buy.browse.search({
      q: query,
      limit: '20',
      sort: 'price',
      filter: 'buyingOptions:{FIXED_PRICE}',
    });

    const items = response.itemSummaries || [];

    return items.map((item: Record<string, unknown>) => ({
      title: (item.title as string) || '',
      price: parseFloat((item.price as { value: string })?.value || '0'),
      condition: (item.condition as string) || 'Unknown',
      imageUrl: (item.image as { imageUrl: string })?.imageUrl || '',
      url: (item.itemWebUrl as string) || '',
      seller: (item.seller as { username: string })?.username || '',
    }));
  } catch (error) {
    console.error('eBay Browse API error:', error);
    return [];
  }
}
