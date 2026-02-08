# Species ID Game

A web-based animal identification quiz game powered by iNaturalist API data.

Users identify animals from images with adjustable difficulty levels and animal group filtering. Built with Next.js, TypeScript, and Tailwind CSS.

## Difficulty Logic

The game uses **taxonomy-based distractors** to adjust difficulty:

### Easy
- **Question animal**: Random species from selected group
- **Distractors**: Same class (e.g., all mammals), but different orders
- **Example**: Show a lion, give options: lion, whale, bat, primate (all mammals but very different)

### Medium
- **Distractors**: Same order as question, but different families
- **Example**: Show a lion, give options: lion, dog, cat, hyena (all carnivores but different families)

### Hard
- **Distractors**: Same family as question
- **Fallback**: Order level if family lacks enough species
- **Example**: Show a lion, give options: lion, tiger, leopard, cheetah (all big cats/Felidae)

### Expert
- **Distractors**: Same genus as question
- **Fallback**: Family → Order if insufficient data
- **Example**: Show a lion, give options: lion, tiger, liger, snow leopard (all Panthera/big cats)

## Features

- 9 animal groups selectable (mammals, birds, fish, reptiles, amphibians, insects, arachnids, mollusks, crustaceans)
- Dark/light mode
- Score tracking per session
- API caching (5-min TTL, ~70% fewer calls)
- Rate limiting (30 req/min per IP)
- Request timeouts (10s per API call)
- Image validation (iNaturalist, Cloudinary, Flickr, Wikimedia only)
- Graceful retry with exponential backoff on failures
