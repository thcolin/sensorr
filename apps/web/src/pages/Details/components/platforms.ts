const ads = (provider) => Number(/with ads/i.test(provider.provider_name))

// JustWatch lists each offer of a platform on its own, "Netflix" beside "Netflix Standard with Ads".
// An offer whose name extends another listed name joins that platform, and the offer without ads leads it.
export const platformsOf = (providers: any[] = []): any[][] => [...providers.reduce((platforms, provider) => {
  const root = providers.reduce((root, other) => (
    provider.provider_name.startsWith(`${other.provider_name} `) && other.provider_name.length < root.provider_name.length ? other : root
  ), provider)
  return platforms.set(root.provider_id, [...(platforms.get(root.provider_id) || []), provider])
}, new Map()).values()].map(offers => offers.sort((a, b) => ads(a) - ads(b) || a.provider_name.length - b.provider_name.length))
